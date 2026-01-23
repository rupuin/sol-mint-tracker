export interface Queue<T> {
	enqueue(item: T): boolean;
	dequeue(): T | undefined;
	peek(): T | undefined;
	isEmpty(): boolean;
	isFull(): boolean;
	size(): number;
	clear(): void;
}
