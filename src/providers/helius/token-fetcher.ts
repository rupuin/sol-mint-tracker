import type { HeliusClient } from "helius-sdk";
import type { Token, TokenFetcher } from "../types.ts";

export class HeliusTokenFetcher implements TokenFetcher {
	private client: HeliusClient;

	constructor(client: HeliusClient) {
		this.client = client;
	}

	async fetchBySignature(signature: string): Promise<Token | null> {
		console.log("[HeliusTokenFetcher] Fetching token for:", signature);

		const mint = await this.extractMintFromTransaction(signature);
		if (!mint) {
			console.log("[HeliusTokenFetcher] No mint found in transaction");
			return null;
		}

		console.log("[HeliusTokenFetcher] Found mint:", mint);

		await this.waitForIndexing();
		return this.fetchTokenMetadata(mint);
	}

	private async waitForIndexing(): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 1500));
	}

	private async extractMintFromTransaction(
		signature: string,
	): Promise<string | null> {
		const txs = await this.client.enhanced.getTransactions({
			transactions: [signature],
		});
		return txs[0]?.tokenTransfers?.[0]?.mint ?? null;
	}

	private async fetchTokenMetadata(mint: string): Promise<Token | null> {
		const asset = await this.client.getAsset({ id: mint });

		if (!asset) {
			console.log("[HeliusTokenFetcher] Asset not found:", mint);
			return null;
		}

		return {
			mint: asset.id,
			name: asset.content?.metadata?.name ?? "Unknown",
			symbol: asset.content?.metadata?.symbol ?? "???",
			image: asset.content?.links?.image,
			supply: asset.token_info?.supply?.toString(),
		};
	}
}
