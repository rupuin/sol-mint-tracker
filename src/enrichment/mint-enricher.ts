import { EventEmitter } from "node:events";
import type { MintDetected } from "../detection/types.ts";
import type { TokenFetcher } from "../providers/index.ts";
import type {
	EnrichmentFailed,
	MintEnriched,
	MintEnrichmentEmitter,
} from "./types.ts";

export class MintEnricher
	extends EventEmitter
	implements MintEnrichmentEmitter
{
	private fetcher: TokenFetcher;

	constructor(fetcher: TokenFetcher) {
		super();
		this.fetcher = fetcher;
	}

	async handleDetection(e: MintDetected): Promise<void> {
		try {
			const token = await this.fetcher.fetchBySignature(e.signature);
			if (!token) {
				console.error("[MintEnricher] no token fetched, silently continuing");
				return;
			}

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
