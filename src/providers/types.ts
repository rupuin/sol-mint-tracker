// ============================================
// Shared Types
// ============================================
export type Commitment = "processed" | "confirmed" | "finalized";

export interface LogSource {
	readonly name: string;
	readonly address: string;
}

export interface Token {
	mint: string;
	name: string;
	symbol: string;
	image?: string;
	supply?: string;
}

// ============================================
// Log Stream
// ============================================
export interface LogStreamOptions {
	sources: LogSource[];
	commitment: Commitment;
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

export interface LogStream {
	start(): Promise<void>;
	stop(): void;
	on(event: "log", listener: (e: LogReceived) => void): this;
	on(event: "error", listener: (e: StreamFailed) => void): this;
}

// ============================================
// Token Fetcher
// ============================================
export interface TokenFetcher {
	fetchBySignature(signature: string): Promise<Token | null>;
}

// ============================================
// Provider
// ============================================
export interface Provider {
	createLogStream(options: LogStreamOptions): LogStream;
	createTokenFetcher(): TokenFetcher;
}
