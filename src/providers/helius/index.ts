import { createHelius } from "helius-sdk";
import { providers } from "../factory.ts";
import { HeliusLogStreamer } from "./log-streamer.ts";
import { HeliusTokenFetcher } from "./token-fetcher.ts";

/**
 * Register Helius as a provider for both log streaming and token fetching
 */
providers.registerLogStreamer("helius", (config) => {
  const client = createHelius({ apiKey: config.apiKey });
  return new HeliusLogStreamer(client);
});

providers.registerTokenFetcher("helius", (config) => {
  const client = createHelius({ apiKey: config.apiKey });
  return new HeliusTokenFetcher(client);
});

export { HeliusLogStreamer } from "./log-streamer.ts";
export { HeliusTokenFetcher } from "./token-fetcher.ts";
