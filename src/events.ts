import type { Token } from "./providers/index.ts";

// Success Events
export interface MintDetected {
	launchpad: string;
	signature: string;
	timestamp: number;
}

export interface MintEnriched {
	launchpad: string;
	signature: string;
	token: Token;
	timestamp: number;
}

// Failure Events
export interface DetectionFailed {
	launchpad: string;
	error: Error;
	timestamp: number;
}

export interface EnrichmentFailed {
	launchpad: string;
	signature: string;
	error: Error;
	timestamp: number;
}
