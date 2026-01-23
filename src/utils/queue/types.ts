export interface Queue<T> {
	enqueue(item: T): boolean | never;
	dequeue(): T | undefined;
	peek(): T | undefined;
	isEmpty(): boolean;
	isFull(): boolean;
	size(): number;
	clear(): void;
}

export interface QueueProcessor<T> {
	enqueue(item: T): boolean;
	start(): void;
	stop(): void;
	drain(): Promise<void>;
	readonly size: number;
}

export interface QueueProcessorOptions<T> {
	queue?: Queue<T>;
	queueMaxSize?: number;
	pollInterval?: number;
	concurrency?: number;
}
