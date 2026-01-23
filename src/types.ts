/**
 * Shared type contracts.
 * NB! No internal imports here to avoid circular dependencies.
 */

// ============================================
// Log Contracts (providers ↔ detection)
// ============================================

export interface LogSource {
	readonly name: string;
	readonly address: string;
}

export interface LogReceived {
	source: LogSource;
	signature: string;
	logs: string[];
	timestamp: number;
}

export interface StreamFailed {
	context: "subscription" | "stream";
	source: LogSource;
	error: Error;
	timestamp: number;
}

// ============================================
// Token Contracts (providers ↔ enrichment)
// ============================================

/**
 * Representation of a token.
 */
export interface Token {
	mint: string;
	name: string;
	symbol: string;
	image?: string;
	supply?: string;
	// fields for future:
	// description?: string;
	// website?: string;
	// socials?: { twitter?: string; telegram?: string };
	// price?: { usd?: number };
}
