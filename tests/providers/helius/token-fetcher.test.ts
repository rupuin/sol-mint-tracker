import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeliusTokenFetcher } from "../../../src/providers/helius/token-fetcher.ts";

// biome-ignore-start lint/suspicious/noExplicitAny: test mock
function mockClient() {
	return {
		enhanced: { getTransactions: vi.fn() },
		getAsset: vi.fn(),
	} as any;
}
// biome-ignore-end lint/suspicious/noExplicitAny: test mock

describe("fetchBySignature", () => {
	let client: ReturnType<typeof mockClient>;
	let fetcher: HeliusTokenFetcher;

	beforeEach(() => {
		vi.useFakeTimers();
		client = mockClient();
		fetcher = new HeliusTokenFetcher(client);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("fetching successful", () => {
		it("calls enhanced.getTransactions with provided signature", async () => {
			client.enhanced.getTransactions.mockResolvedValue([]);
			fetcher.fetchBySignature("sig123");
			expect(client.enhanced.getTransactions).toHaveBeenCalledWith({
				transactions: ["sig123"],
			});
		});

		it("waits 1500ms before calling getAsset with mint address", async () => {
			client.enhanced.getTransactions.mockResolvedValue([
				{ tokenTransfers: [{ mint: "mint" }] },
			]);

			fetcher.fetchBySignature("sig");
			expect(client.getAsset).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1500);
			expect(client.getAsset).toHaveBeenCalledWith({ id: "mint" });
		});

		it("returns token metadata with fields mapped from asset", async () => {
			client.enhanced.getTransactions.mockResolvedValue([
				{ tokenTransfers: [{ mint: "mint" }] },
			]);

			client.getAsset.mockResolvedValue({
				id: "addr",
				content: {
					metadata: { name: "my-token", symbol: "mt" },
					links: { image: "https://url" },
				},
				token_info: { supply: 1000 },
			});

			const promise = fetcher.fetchBySignature("sig123");
			await vi.advanceTimersByTimeAsync(1500);
			const res = await promise;

			expect(res?.mint).toEqual("addr");
		});

		it("uses defaults for missing token metadata fields", async () => {
			client.enhanced.getTransactions.mockResolvedValue([
				{ tokenTransfers: [{ mint: "mint" }] },
			]);
			client.getAsset.mockResolvedValue({ id: "mint" });

			const promise = fetcher.fetchBySignature("sig");
			await vi.advanceTimersByTimeAsync(1500);
			const res = await promise;

			expect(res?.name).toBe("[no name]");
			expect(res?.symbol).toBe("???");
		});
	});

	describe("fetching failed", () => {
		it("returns null and doesn't call getAsset when mint cannot be extracted", async () => {
			client.enhanced.getTransactions.mockResolvedValue([]);
			const res = await fetcher.fetchBySignature("sig123");
			expect(res).toBeNull();
			expect(client.getAsset).not.toHaveBeenCalled();
		});

		it("returns null when asset is not found", async () => {
			client.enhanced.getTransactions.mockResolvedValue([
				{ tokenTransfers: [{ mint: "mint" }] },
			]);
			client.getAsset.mockResolvedValue(null);

			const promise = fetcher.fetchBySignature("sig123");
			await vi.advanceTimersByTimeAsync(1500);
			const res = await promise;

			expect(client.getAsset).toHaveBeenCalledWith({ id: "mint" });
			expect(res).toBeNull();
		});
	});
});
