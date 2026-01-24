import { LinkedQueue } from "./linked-queue.ts";
import type { Queue, QueueProcessor, QueueProcessorOptions } from "./types.ts";

export class AsyncQueueProcessor<T> implements QueueProcessor<T> {
	private readonly queue: Queue<T>;
	private readonly handler: (item: T) => Promise<void>;
	private readonly pollInterval: number;
	private readonly concurrency: number;

	private isRunning = false;
	private activeProcessCount = 0;

	constructor(
		handler: (item: T) => Promise<void>,
		opts: QueueProcessorOptions<T>,
	) {
		this.queue = opts.queue ?? new LinkedQueue<T>(opts.queueMaxSize ?? 100);
		this.handler = handler;
		this.pollInterval = opts.pollInterval ?? 50;
		this.concurrency = opts.concurrency ?? 1;
	}

	enqueue(item: T): boolean {
		try {
			return this.queue.enqueue(item);
		} catch (err: unknown) {
			if (err instanceof Error && err.message === "Queue full") {
				console.error(err);
			}
			return false;
		}
	}

	start(): void {
		if (this.isRunning) return;
		this.isRunning = true;

		for (let i = 0; i < this.concurrency; i++) {
			this.spawnWorker();
		}
	}

	stop(): void {
		this.isRunning = false;
	}

	async drain(): Promise<void> {
		while (!this.queue.isEmpty() || this.activeProcessCount > 0) {
			await this.sleep(this.pollInterval);
		}
	}

	get size(): number {
		return this.queue.size();
	}

	private async spawnWorker(): Promise<void> {
		while (this.isRunning) {
			const item = this.queue.dequeue();

			if (item !== undefined) {
				try {
					this.activeProcessCount++;
					await this.handler(item);
				} catch (err) {
					console.error("Queue item handler error:", err);
				} finally {
					this.activeProcessCount--;
				}
			} else {
				await this.sleep(this.pollInterval);
			}
		}
	}

	private async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
