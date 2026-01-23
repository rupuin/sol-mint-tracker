import type { LogReceived, LogSource, StreamFailed, Token } from "../types.ts";

// Re-export shared contracts for provider implementations
export type { LogReceived, LogSource, StreamFailed, Token };

// ============================================
// Provider-specific Types
// ============================================
export type Commitment = "processed" | "confirmed" | "finalized";

export interface LogStreamOptions {
	sources: LogSource[];
	commitment: Commitment;
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
