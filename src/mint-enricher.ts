import { EventEmitter } from "events";
import type { TokenFetcher } from "./providers/index.ts";
import type {
  MintEnrichmentEmitter,
  MintDetectionEmitter,
} from "./interfaces.ts";
import type { MintDetected, MintEnriched, EnrichmentFailed } from "./events.ts";

export class MintEnricher
  extends EventEmitter
  implements MintEnrichmentEmitter
{
  private fetcher: TokenFetcher;

  constructor(fetcher: TokenFetcher) {
    super();
    this.fetcher = fetcher;
  }

  listenTo(source: MintDetectionEmitter): void {
    source.on("detected", (e) => this.handleDetection(e));
    source.on("error", (e) => this.emit("error", e));
  }

  private async handleDetection(e: MintDetected): Promise<void> {
    try {
      const token = await this.fetcher.fetchBySignature(e.signature);
      if (!token) return;

      this.emit("enriched", {
        launchpad: e.launchpad,
        signature: e.signature,
        token,
        timestamp: Date.now(),
      } satisfies MintEnriched);
    } catch (err: unknown) {
      this.emit("error", {
        launchpad: e.launchpad,
        signature: e.signature,
        error: err instanceof Error ? err : new Error(String(err)),
        timestamp: Date.now(),
      } satisfies EnrichmentFailed);
    }
  }
}
