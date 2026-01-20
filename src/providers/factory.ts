import type {
  LogStreamer,
  TokenFetcher,
  ProviderConfig,
} from "./types.ts";

export type LogStreamerFactory = (config: ProviderConfig) => LogStreamer;
export type TokenFetcherFactory = (config: ProviderConfig) => TokenFetcher;

class ProviderRegistry {
  private logStreamers = new Map<string, LogStreamerFactory>();
  private tokenFetchers = new Map<string, TokenFetcherFactory>();

  registerLogStreamer(name: string, factory: LogStreamerFactory): void {
    this.logStreamers.set(name, factory);
  }

  registerTokenFetcher(name: string, factory: TokenFetcherFactory): void {
    this.tokenFetchers.set(name, factory);
  }

  createLogStreamer(name: string, config: ProviderConfig): LogStreamer {
    const factory = this.logStreamers.get(name);
    if (!factory) {
      throw new Error(
        `LogStreamer "${name}" not registered. Available: ${this.listLogStreamers().join(", ") || "none"}`,
      );
    }
    return factory(config);
  }

  createTokenFetcher(name: string, config: ProviderConfig): TokenFetcher {
    const factory = this.tokenFetchers.get(name);
    if (!factory) {
      throw new Error(
        `TokenFetcher "${name}" not registered. Available: ${this.listTokenFetchers().join(", ") || "none"}`,
      );
    }
    return factory(config);
  }

  listLogStreamers(): string[] {
    return [...this.logStreamers.keys()];
  }

  listTokenFetchers(): string[] {
    return [...this.tokenFetchers.keys()];
  }
}

export const providers = new ProviderRegistry();
