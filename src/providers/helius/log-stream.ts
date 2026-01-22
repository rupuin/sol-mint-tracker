import { EventEmitter } from "events";
import type { HeliusClient } from "helius-sdk";
import type {
  LogStream,
  LogSource,
  LogReceived,
  StreamFailed,
  Commitment,
} from "../types.ts";

export class HeliusLogStream extends EventEmitter implements LogStream {
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
      this.sources.map((source) => this.subscribeToSource(source)),
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
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      this.emitError(
        "stream",
        err instanceof Error ? err : new Error(String(err)),
        source,
      );
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
      const log = (notification as { value?: unknown }).value ?? notification;
      this.emitLog(source, log);
    }
  }

  private emitLog(source: LogSource, rawLog: unknown): void {
    const event: LogReceived = {
      source,
      signature: (rawLog as { signature: string }).signature,
      logs: (rawLog as { logs?: string[] }).logs ?? [],
      timestamp: Date.now(),
    };
    this.emit("log", event);
  }

  private emitError(
    context: StreamFailed["context"],
    error: Error,
    source: LogSource,
  ): void {
    const event: StreamFailed = {
      context,
      source,
      error,
      timestamp: Date.now(),
    };
    this.emit("error", event);
  }
}
