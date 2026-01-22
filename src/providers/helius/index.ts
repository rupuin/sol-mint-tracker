import { createHelius } from "helius-sdk";
import type { LogStreamOptions, Provider } from "../types.ts";
import { HeliusLogStream } from "./log-stream.ts";
import { HeliusTokenFetcher } from "./token-fetcher.ts";

export function createHeliusProvider(apiKey: string): Provider {
	const client = createHelius({ apiKey });

	return {
		createLogStream: (opts: LogStreamOptions) =>
			new HeliusLogStream(client, opts.sources, opts.commitment),
		createTokenFetcher: () => new HeliusTokenFetcher(client),
	};
}
