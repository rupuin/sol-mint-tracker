import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type EnrichmentFailed,
	type MintEnriched,
	MintEnricher,
} from "../../src/enrichment/index.ts";
import type { Token, TokenFetcher } from "../../src/providers/index.ts";

// import type { Token } from "../../src/types.ts";

function mockTokenFetcher(returnValue: Token | null): TokenFetcher {
	return { fetchBySignature: vi.fn().mockResolvedValue(returnValue) };
}

describe("MintEnricher", () => {
	let enricher: MintEnricher;
	let fetcher: ReturnType<typeof mockTokenFetcher>;
	let enriched: MintEnriched[];
	let errors: EnrichmentFailed[];

	beforeEach(() => {
		fetcher = mockTokenFetcher({ mint: "abc", name: "Test", symbol: "TST" });
		enricher = new MintEnricher(fetcher);
		enriched = [];
		errors = [];

		enricher.on("enriched", (e) => enriched.push(e));
		enricher.on("error", (e) => errors.push(e));
	});

	describe("handleDetection", () => {
		it("emits enriched when token metadata is fetched", async () => {
			await enricher.handleDetection({
				launchpad: "lp",
				signature: "sig",
				timestamp: Date.now(),
			});

			expect(fetcher.fetchBySignature).toHaveBeenCalledWith("sig");
			expect(enriched[0]?.launchpad).toBe("lp");
			expect(enriched[0]?.token.mint).toBe("abc");
		});

		it("does not emit anything when token fetch returns null", async () => {
			fetcher = mockTokenFetcher(null);
			enricher = new MintEnricher(fetcher);

			await enricher.handleDetection({
				launchpad: "lp",
				signature: "sig",
				timestamp: Date.now(),
			});

			expect(enriched).toHaveLength(0);
			expect(errors).toHaveLength(0);
		});

		it("emits error event when fetching throws", async () => {
			fetcher.fetchBySignature = vi
				.fn()
				.mockRejectedValue(new Error("unexpected"));

			await enricher.handleDetection({
				launchpad: "lp",
				signature: "sig",
				timestamp: Date.now(),
			});

			expect(enriched).toHaveLength(0);
			expect(errors[0]?.error.message).toBe("unexpected");
		});
	});
});
