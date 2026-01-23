import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	DetectionFailed,
	MintDetected,
} from "../../src/detection/index.ts";
import {
	type EnrichmentFailed,
	type MintEnriched,
	MintEnricher,
} from "../../src/enrichment/index.ts";
import type { Token, TokenFetcher } from "../../src/providers/index.ts";

function mockDetector() {
	return new EventEmitter() as EventEmitter & {
		on(event: "detected", listener: (e: MintDetected) => void): EventEmitter;
		on(event: "error", listener: (e: DetectionFailed) => void): EventEmitter;
	};
}

function token(overrides: Partial<Token> = {}): Token {
	return {
		mint: "test-mint",
		name: "Test Token",
		symbol: "TEST",
		...overrides,
	};
}

function mockTokenFetcher(returnValue: Token | null): TokenFetcher {
	return { fetchBySignature: vi.fn().mockResolvedValue(returnValue) };
}

describe("MintEnricher", () => {
	let enricher: MintEnricher;
	let detector: ReturnType<typeof mockDetector>;
	let fetcher: ReturnType<typeof mockTokenFetcher>;
	let enriched: MintEnriched[];
	let errors: (DetectionFailed | EnrichmentFailed)[];

	beforeEach(() => {
		fetcher = mockTokenFetcher(
			token({ mint: "abc", name: "Test", symbol: "TST" }),
		);
		enricher = new MintEnricher(fetcher);
		detector = mockDetector();
		enriched = [];
		errors = [];

		enricher.on("enriched", (e) => enriched.push(e));
		enricher.on("error", (e) => errors.push(e));
		enricher.listenTo(detector);
	});

	describe("enrichment", () => {
		it("fetches token and emits enriched event", async () => {
			detector.emit("detected", {
				launchpad: "PumpFun",
				signature: "sig123",
				timestamp: Date.now(),
			} satisfies MintDetected);

			await vi.waitFor(() => expect(enriched).toHaveLength(1));

			expect(fetcher.fetchBySignature).toHaveBeenCalledWith("sig123");
			expect(enriched[0]?.token.mint).toBe("abc");
			expect(enriched[0]?.launchpad).toBe("PumpFun");
		});

		it("does not emit when token fetch returns null", async () => {
			fetcher.fetchBySignature = vi.fn().mockResolvedValue(null);

			detector.emit("detected", {
				launchpad: "PumpFun",
				signature: "sig123",
				timestamp: Date.now(),
			} satisfies MintDetected);

			await vi.waitFor(() =>
				expect(fetcher.fetchBySignature).toHaveBeenCalled(),
			);
			expect(enriched).toHaveLength(0);
		});
	});

	describe("error handling", () => {
		it("emits enrichment error when fetch fails", async () => {
			fetcher.fetchBySignature = vi
				.fn()
				.mockRejectedValue(new Error("API error"));

			detector.emit("detected", {
				launchpad: "PumpFun",
				signature: "sig123",
				timestamp: Date.now(),
			} satisfies MintDetected);

			await vi.waitFor(() => expect(errors).toHaveLength(1));

			const err = errors[0] as EnrichmentFailed;
			expect(err.signature).toBe("sig123");
			expect(err.error.message).toBe("API error");
		});

		it("forwards detector errors", () => {
			const err: DetectionFailed = {
				launchpad: "PumpFun",
				error: new Error("Stream died"),
				timestamp: Date.now(),
			};

			detector.emit("error", err);

			expect(errors).toHaveLength(1);
			expect(errors[0]).toBe(err);
		});
	});
});
