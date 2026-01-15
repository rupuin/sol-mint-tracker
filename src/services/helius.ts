import fs from "fs/promises";

import { createHelius } from "helius-sdk";
import type { HeliusClient } from "helius-sdk";
import type { ProgramDefinition, TokenMetadata } from "../interfaces.ts";

export class HeliusService {
  private client: HeliusClient;
  private watchedPrograms: ProgramDefinition[];

  constructor(apiKey: string, watchedPrograms: ProgramDefinition[]) {
    this.client = createHelius({ apiKey: apiKey, network: "mainnet" });
    this.watchedPrograms = watchedPrograms;
  }

  public async startTracking() {
    const programs = this.watchedPrograms.map((p) => p.address);

    const req = await this.client.ws.logsNotifications(
      { mentions: programs },
      { commitment: "confirmed" },
    );

    const ac = new AbortController();
    const stream = await req.subscribe({ abortSignal: ac.signal });

    for await (const notif of stream) {
      const log = (notif as any).value ?? notif;
      this.processLog(log);
    }
  }

  private async processLog(log: any) {
    const lines: string[] = log.logs;

    const match = this.watchedPrograms.find(
      (p) => this.isProgramMentioned(lines, p.address) && p.isNewMint(log),
    );

    if (match) {
      this.enrichTokenData(log.signature, match.label).catch((err) => {
        console.error(`❌ Enrichment failed for ${log.signature}:`, err);
      });
    }
  }

  private async enrichTokenData(
    signature: string,
    label: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const asset = await this.fetchAsset(signature);

    if (asset) {
      const metadata: TokenMetadata = {
        mint: asset.id,
        name: asset?.content?.metadata?.name,
        symbol: asset?.content?.metadata?.symbol,
        image: asset?.content?.links?.image,
        supply: asset.token_info?.supply?.toString(),
      };

      console.log(`\n🚀 [${label}] New Token Detected!`);
      console.log(`📝 Name:   ${metadata.name}`);
      // console.log(`🏷️ Symbol: ${metadata.symbol}`);
      // console.log(`📦 Supply: ${metadata.supply}`);
      console.log(`🆔 Mint:   ${metadata.mint}`);
      //
      // console.log(`🖼️ Image:  ${metadata.image}`);
      //
      // console.log(`🔗 Link:   https://solscan.io/token/${metadata.mint}`);
      // console.log(`───────────────────────────────────────────`);
    }
  }

  private async fetchAsset(signature: string): Promise<any | null> {
    try {
      const tx = await this.client.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      const output = JSON.stringify(
        { signature: signature, transaction: tx },
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      );

      await fs.writeFile("transaction-output.json", output);
      const mint = tx?.meta?.postTokenBalances?.[0]?.mint;
      if (!mint) return null;

      return await this.client.getAsset({ id: mint });
    } catch (err) {
      console.error("❌ Metadata fetch failed", err);
      return null;
    }
  }

  private isProgramMentioned(lines: string[], programAdress: string): boolean {
    return lines.some((line) => line.includes(programAdress));
  }
}
