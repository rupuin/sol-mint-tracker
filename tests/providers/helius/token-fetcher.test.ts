import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeliusTokenFetcher } from "../../../src/providers/helius/token-fetcher.ts";
import { afterEach } from "node:test";

function mockClient() {
	return {
		enhanced: { getTransactions: vi.fn() },
		getAsset: vi.fn(),
	} as any;
}

describe("HeliusTokenFetcher", () => {
	const client = mockClient();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("fetchBySignature", () => {
		const fetcher = new HeliusTokenFetcher(client);
		const sig = "sig123";
		const mint = "mint123";

		client.enhanced.getTransactions.mockResolvedValue([
			{
				tokenTransfers: [{ mint }],
			},
		]);

		it("calls sdk's getTransactions with provided signature", async () => {
			fetcher.fetchBySignature(sig);

			expect(client.enhanced.getTransactions).toHaveBeenCalledWith({
				transactions: [sig],
			});
		});

		it("waits and calls sdk's getAsset with extracted mint", async () => {
			const promise = fetcher.fetchBySignature(sig);
			expect(client.getAsset).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1500);
			await promise;

			expect(client.getAsset).toHaveBeenCalledWith({ id: mint });
		});
	});
});
