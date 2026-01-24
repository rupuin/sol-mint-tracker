import type { Token } from "../types.ts";

// Re-export Token for module consumers
export type { Token };

/**
 * Emitted when a detected mint is enriched with token metadata
 */
export interface MintEnriched {
	launchpad: string;
	signature: string;
	token: Token;
	timestamp: number;
}

/**
 * Emitted when enrichment fails (e.g., API error)
 */
export interface EnrichmentFailed {
	launchpad: string;
	signature: string;
	error: Error;
	timestamp: number;
}

/**
 * Event emitter interface for mint enrichment
 */
export interface MintEnrichmentEmitter {
	on(event: "enriched", listener: (e: MintEnriched) => void): this;
	on(event: "error", listener: (e: EnrichmentFailed) => void): this;
}
