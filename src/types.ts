/**
 * Shared type contracts (between providers and enrichers).
 * NB! No internal imports here to avoid circular dependencies.
 */

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
