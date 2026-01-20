import EventEmitter from "events";
import type { HeliusClient } from "helius-sdk";
import type {
  LogStreamer,
  LogStream,
  StreamOptions,
  LogSource,
  RawLogEvent,
  StreamErrorEvent,
  Commitment,
} from "../types.ts";

/**
 * Helius client implementation of LogStreamer factory
 */
export class HeliusLogStreamer implements LogStreamer {
  private client: HeliusClient;

  constructor(client: HeliusClient) {
    this.client = client;
  }

  createStream(opts: StreamOptions): LogStream {
    return new HeliusLogStream(this.client, opts.sources, opts.commitment);
  }
}

/**
 * Helius client implementation of LogStream connection
 */
class HeliusLogStream extends EventEmitter implements LogStream {
  private client: HeliusClient;
  private sources: LogSource[];
  private commitment: Commitment;
  private abortControllers = new Map<string, AbortController>();

  constructor(
    client: HeliusClient,
    sources: LogSource[],
    commitment: Commitment,
  ) {
    super();
    this.client = client;
    this.sources = sources;
    this.commitment = commitment;
  }

  async start(): Promise<void> {
    console.log(`[HeliusLogStream] Starting (${this.commitment})`);

    const results = await Promise.allSettled(
      this.sources.map((account) => this.subscribeToSource(account)),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.warn(
        `[HeliusLogStream] ${failed}/${this.sources.length} subscriptions failed`,
      );
    }
  }

  stop(): void {
    console.log("[HeliusLogStream] Stopping all subscriptions");
    for (const [id, controller] of this.abortControllers.entries()) {
      controller.abort();
      console.log(`[HeliusLogStream] Stopped: ${id}`);
    }
    this.abortControllers.clear();
  }

  stopFor(sourceName: string): void {
    const controller = this.abortControllers.get(sourceName);
    if (!controller) return;

    controller.abort();
    this.abortControllers.delete(sourceName);
    console.log(`[HeliusLogStream] Stopped: ${sourceName}`);
  }

  private async subscribeToSource(source: LogSource): Promise<void> {
    const stream = await this.openStream(source).catch((err) => {
      this.emitError("subscription", err, source);
      return null;
    });

    if (!stream) return;

    console.log(`[HeliusLogStream] Subscribed to ${source.name}`);

    try {
      await this.consumeStream(stream, source);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      this.emitError("stream", err, source);
    }
  }

  private async openStream(source: LogSource): Promise<AsyncIterable<unknown>> {
    const req = await this.client.ws.logsNotifications(
      { mentions: [source.address] },
      { commitment: this.commitment },
    );

    const ac = new AbortController();
    this.abortControllers.set(source.name, ac);

    return req.subscribe({ abortSignal: ac.signal });
  }

  private async consumeStream(
    stream: AsyncIterable<unknown>,
    source: LogSource,
  ): Promise<void> {
    for await (const notification of stream) {
      const log = (notification as any).value ?? notification;
      this.emitLog(source, log);
    }
  }

  private emitLog(source: LogSource, rawLog: unknown): void {
    const event: RawLogEvent = {
      source,
      signature: (rawLog as any).signature,
      logs: (rawLog as any).logs ?? [],
      timestamp: Date.now(),
    };
    this.emit("log", event);
  }

  private emitError(
    context: StreamErrorEvent["context"],
    error: Error,
    source: LogSource,
    signature?: string,
  ): void {
    const event: StreamErrorEvent = {
      context,
      source,
      error,
      timestamp: Date.now(),
      ...(signature !== undefined && { signature }),
    };
    this.emit("error", event);
  }
}
