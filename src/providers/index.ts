/**
 * Provider layer entry point
 *
 * Import this file to register all providers and access the factory.
 * Provider implementations are registered as side effects on import.
 */

// Register all provider implementations
import "./helius/index.ts";

// Export factory and types
export { providers } from "./factory.ts";
export type {
  LogStreamerFactory,
  TokenFetcherFactory,
} from "./factory.ts";

export type {
  // Core types
  Commitment,
  LogSource,
  Token,
  ProviderConfig,
  // Log streaming
  LogStreamer,
  LogStream,
  StreamOptions,
  RawLogEvent,
  StreamErrorEvent,
  // Token fetching
  TokenFetcher,
} from "./types.ts";

// Export concrete implementations for direct usage if needed
export { HeliusLogStreamer, HeliusTokenFetcher } from "./helius/index.ts";
