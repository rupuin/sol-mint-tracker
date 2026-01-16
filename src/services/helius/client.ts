import EventEmitter from "events";

import { createHelius, type HeliusClient } from "helius-sdk";
import type { ProgramDefinition } from "../../interfaces.ts";
import type { HeliusErrorEvent, HeliusLogEvent } from "./events.ts";

export interface HeliusSubscriberConfig {
  apiKey: string;
  programs: ProgramDefinition[];
  commitment: "processed" | "confirmed" | "finalized";
  network: "mainnet" | "devnet";
}

export class HeliusSubscriber extends EventEmitter {
  private client: HeliusClient;
  private programs: ProgramDefinition[];
  private commitment: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: HeliusSubscriberConfig) {
    super();
    this.client = createHelius({
      apiKey: config.apiKey,
      network: config.network,
    });
    this.programs = config.programs;
    this.commitment = config.commitment;
  }

  public async start(): Promise<void> {
    console.log(`Starting Helius subscriber (${this.commitment})`);

    const subscriptions = this.programs.map((p) => this.subscribeToProgram(p));
    await Promise.all(subscriptions);
  }

  public stop(): void {
    console.log("Stopping all subscriptions...");
    for (const [label, controller] of this.abortControllers.entries()) {
      controller.abort();
      console.log("Stopped:", label);
    }
    this.abortControllers.clear(); // TODO: why clear?
  }

  public stopProgram(label: string): void {
    const controller = this.abortControllers.get(label);
    if (!controller) return;

    controller.abort();
    this.abortControllers.delete(label);
    console.log("Stopped subscription:", label);
  }

  private async subscribeToProgram(program: ProgramDefinition): Promise<void> {
    let stream: AsyncIterable<any> | undefined;

    try {
      stream = await this.openLogStream(program);
      console.log(`Subscribed to ${program.label} for new mints...`);
    } catch (err: any) {
      this.emitHeliusError({
        context: "subscription",
        program: program.label,
        error: err,
      });
      return;
    }

    try {
      if (!stream) return;
      for await (const notification of stream) {
        const log = (notification as any).value ?? notification;
        this.emitLogEvent(log, program.label);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;

      this.emitHeliusError({
        context: "stream",
        program: program.label,
        error: err,
      });
    }
  }

  private async openLogStream(
    program: ProgramDefinition,
  ): Promise<AsyncIterable<any>> {
    const req = await this.client.ws.logsNotifications(
      { mentions: [program.address] },
      { commitment: this.commitment },
    );

    const ac = new AbortController();
    this.abortControllers.set(program.label, ac);

    return req.subscribe({ abortSignal: ac.signal });
  }

  private emitLogEvent(log: any, programLabel: string): void {
    try {
      this.emit("event", {
        type: "helius:log",
        program: programLabel,
        signature: log.signature,
        rawLog: log,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      this.emitHeliusError({
        context: "processing",
        program: programLabel,
        signature: log?.signature,
        error: err,
      });
    }
  }

  private emitHeliusError(params: {
    context: HeliusErrorEvent["context"];
    program?: string;
    signature?: string;
    error: Error;
  }): void {
    const event: HeliusErrorEvent = {
      type: "helius:error",
      context: params.context,
      error: params.error,
      timestamp: Date.now(),
    };

    if (params.program) {
      event.program = params.program;
    }

    if (params.signature) {
      event.signature = params.signature;
    }

    this.emit("event", event);
  }

  private async processLog(log: any, program: ProgramDefinition) {
    const event: HeliusLogEvent = {
      type: "helius:log",
      program: program.label,
      signature: log.signature,
      rawLog: log,
      timestamp: Date.now(),
    };

    this.emit("event", event);
  }

  public getClient(): HeliusClient {
    return this.client;
  }

  // private async enrichTokenData(
  //   signature: string,
  //   label: string,
  // ): Promise<void> {
  //   await new Promise((resolve) => setTimeout(resolve, 1500));
  //
  //   const asset = await this.fetchAsset(signature);
  //
  //   if (asset) {
  //     const metadata: TokenMetadata = {
  //       mint: asset.id,
  //       name: asset?.content?.metadata?.name,
  //       symbol: asset?.content?.metadata?.symbol,
  //       image: asset?.content?.links?.image,
  //       supply: asset.token_info?.supply?.toString(),
  //     };
  //
  //     console.log(`\n🚀 [${label}] New Token Detected!`);
  //     console.log(`📝 Name:   ${metadata.name}`);
  //     // console.log(`🏷️ Symbol: ${metadata.symbol}`);
  //     // console.log(`📦 Supply: ${metadata.supply}`);
  //     console.log(`🆔 Mint:   ${metadata.mint}`);
  //     //
  //     // console.log(`🖼️ Image:  ${metadata.image}`);
  //     //
  //     // console.log(`🔗 Link:   https://solscan.io/token/${metadata.mint}`);
  //     // console.log(`───────────────────────────────────────────`);
  //   }
  // }

  // private async fetchAsset(signature: string): Promise<any | null> {
  //   try {
  //     const tx = await this.client.getTransaction(signature, {
  //       maxSupportedTransactionVersion: 0,
  //     });
  //     const output = JSON.stringify(
  //       { signature: signature, transaction: tx },
  //       (_, value) => (typeof value === "bigint" ? value.toString() : value),
  //       2,
  //     );
  //
  //     await fs.writeFile("transaction-output.json", output);
  //     const mint = tx?.meta?.postTokenBalances?.[0]?.mint;
  //     if (!mint) return null;
  //
  //     return await this.client.getAsset({ id: mint });
  //   } catch (err) {
  //     console.error("❌ Metadata fetch failed", err);
  //     return null;
  //   }
  // }
  //
  // private isProgramMentioned(lines: string[], programAdress: string): boolean {
  //   return lines.some((line) => line.includes(programAdress));
  // }
}
