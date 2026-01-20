// Core Types

export type Commitment = "processed" | "confirmed" | "finalized";

/**
 * Represents a program source to monitor on-chain
 */
export interface LogSource {
  readonly name: string;
  readonly address: string;
}

/**
 * Token metadata returned from the blockchain
 */
export interface Token {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  supply?: string;
}

// Log Streaming

export interface StreamOptions {
  sources: LogSource[];
  commitment: Commitment;
}

/**
 * Factory for creating log streams
 */
export interface LogStreamer {
  createStream(opts: StreamOptions): LogStream;
}

/**
 * Active log stream websocket
 */
export interface LogStream {
  start(): Promise<void>;
  stop(): void;
  stopFor(sourceName: string): void;
  on(event: "log", listener: (event: RawLogEvent) => void): this;
  on(event: "error", listener: (event: StreamErrorEvent) => void): this;
}

/**
 * Raw log event from the blockchain
 */
export interface RawLogEvent {
  source: LogSource;
  signature: string;
  logs: string[];
  timestamp: number;
}

export type InfraErrorContext = "subscription" | "stream" | "processing";

/**
 * Error event during streaming
 */
export interface StreamErrorEvent {
  context: InfraErrorContext;
  source: LogSource;
  signature?: string;
  error: Error;
  timestamp: number;
}

// Token Fetching

/**
 * Fetches token metadata from the blockchain
 */
export interface TokenFetcher {
  mintsFoundCounter: number;
  mintsFetchedCounter: number;
  fetchBySignature(signature: string): Promise<Token | null>;
}

// Provider Configuration

export interface ProviderConfig {
  apiKey: string;
  [key: string]: unknown;
}
