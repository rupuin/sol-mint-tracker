import { EventEmitter } from "events";
import type { LogStream, TokenFetcher } from "./providers/index.ts";
import type { MintDetector } from "./mint-detector.ts";
import type {
  MintDetectedEvent,
  MintEnrichedEvent,
  MintErrorEvent,
} from "./events.ts";

export class MintEnricher extends EventEmitter {
  on(e: "enriched", listener: (e: MintEnrichedEvent) => void): this;
  on(e: "error", listener: (e: MintErrorEvent) => void): this;
  on(e: string, listener: (...args: any[]) => void): this {
    return super.on(e, listener);
  }

  private fetcher: TokenFetcher;

  constructor(fetcher: TokenFetcher) {
    super();
    this.fetcher = fetcher;
  }

  public attachTo(detector: MintDetector): void {
    detector.on("detected", (e) => this.handleDetection(e));
    detector.on("error", (e) => this.emit("error", e));
  }

  private async handleDetection(e: MintDetectedEvent): Promise<void> {
    try {
      const token = await this.fetcher.fetchBySignature(e.signature);
      if (!token) return; // TODO: handle err?
      this.emit("enriched", {
        launchpad: e.launchpad,
        signature: e.signature,
        token: token,
        timestamp: Date.now(),
      } satisfies MintEnrichedEvent);
    } catch (err: any) {
      this.emit("error", {
        context: "enrichment",
        launchpad: e.launchpad,
        error: err,
        timestamp: Date.now(),
        ...(e.signature !== undefined && { signature: e.signature }),
      } satisfies MintErrorEvent);
    }
  }

  // private handleError(e: MintErrorEvent): void {
  //   this.emit("error", {
  //     context: "enrichment",
  //     launchpad: e.launchpad,
  //     error: e.error,
  //     timestamp: e.timestamp,
  //     ...(e.signature !== undefined && { signature: e.signature }),
  //   } satisfies MintErrorEvent);
  // }
}
