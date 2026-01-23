/**
 * Shared type contracts.
 * This file must have NO internal imports to avoid circular dependencies.
 * Both domain and infrastructure modules depend on these abstractions.
 */

/**
 * Domain representation of a token.
 * Providers map their API responses to this interface.
 * Fields may grow as more providers contribute metadata.
 */
export interface Token {
	mint: string;
	name: string;
	symbol: string;
	image?: string;
	supply?: string;
	// Future fields from additional providers:
	// description?: string;
	// website?: string;
	// socials?: { twitter?: string; telegram?: string };
	// price?: { usd?: number };
}
