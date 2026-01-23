export interface Queue<T> {
	enqueue(item: T): boolean | never;
	dequeue(): T | undefined;
	peek(): T | undefined;
	isEmpty(): boolean;
	isFull(): boolean;
	size(): number;
	clear(): void;
}
