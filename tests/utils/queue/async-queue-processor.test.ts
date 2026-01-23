import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AsyncQueueProcessor } from "../../../src/utils/queue/async-queue-processor.ts";

describe("AsyncQueueProcessor", () => {
	const opts = { pollInterval: 50, queueMaxSize: 10 };

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("worker lifecycle", () => {
		it("doesn't process unless started", async () => {
			const handler = vi.fn();
			const processor = new AsyncQueueProcessor(handler, opts);

			processor.enqueue("item");

			await vi.advanceTimersByTimeAsync(50);
			expect(handler).not.toHaveBeenCalled();
		});

		it("stops processing after calling stop()", async () => {
			const handler = vi.fn();
			const processor = new AsyncQueueProcessor(handler, opts);

			processor.start();
			processor.stop();
			processor.enqueue(192);

			await vi.advanceTimersByTimeAsync(50);
			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("handler invocation", () => {
		it("calls handler for each item", async () => {
			const handler = vi.fn().mockResolvedValue(undefined);
			const processor = new AsyncQueueProcessor(handler, opts);

			processor.enqueue("a");
			processor.enqueue("b");
			processor.enqueue("c");
			processor.start();

			await vi.advanceTimersByTimeAsync(50);
			processor.stop();

			expect(handler).toHaveBeenCalledWith("a");
			expect(handler).toHaveBeenCalledWith("b");
			expect(handler).toHaveBeenCalledWith("c");
		});

		it("continues processing after handler throws err", async () => {
			const handler = vi
				.fn()
				.mockRejectedValueOnce(new Error("HandlerError"))
				.mockResolvedValueOnce("resolved-success");
			const processor = new AsyncQueueProcessor(handler, opts);

			processor.enqueue("fail");
			processor.enqueue("success");
			processor.start();
			await vi.advanceTimersByTimeAsync(100);
			processor.stop();

			expect(handler).toHaveBeenCalledTimes(2);
			expect(handler).toHaveBeenNthCalledWith(1, "fail");
			expect(handler).toHaveNthResolvedWith(2, "resolved-success");
		});
	});

	describe("drain", () => {
		it("waits untill work is finished", async () => {
			let isDrained = false;
			const handler = vi.fn().mockImplementation(async () => {
				await new Promise((r) => setTimeout(r, 100));
				isDrained = true;
			});
			const processor = new AsyncQueueProcessor(handler, opts);

			processor.enqueue("slow-task");
			processor.start();

			const drainPromise = processor.drain();

			await vi.advanceTimersByTimeAsync(50);
			expect(isDrained).toBe(false);

			await vi.advanceTimersByTimeAsync(100);
			await drainPromise;
			expect(isDrained).toBe(true);
			processor.stop();
		});
	});

	describe("concurrency", () => {
		it("runs multiple workers in parallel", async () => {
			let currentActive = 0;
			let maxConcurrent = 0;
			const handler = vi.fn().mockImplementation(async () => {
				currentActive++;
				maxConcurrent = Math.max(currentActive, maxConcurrent);
				await new Promise((r) => setTimeout(r, 100));
				currentActive--;
			});
			const processor = new AsyncQueueProcessor(handler, {
				...opts,
				concurrency: 3,
			});
			processor.enqueue(1);
			processor.enqueue(2);
			processor.enqueue(3);
			processor.start();

			await vi.advanceTimersByTimeAsync(50);
			expect(maxConcurrent).toBe(3);
			processor.stop();
		});
	});
});
