import type { Queue } from "./types.ts";

class Node<T> {
	value: T;
	next: Node<T> | null = null;

	constructor(item: T) {
		this.value = item;
	}
}

export class LinkedQueue<T> implements Queue<T> {
	private head: Node<T> | null = null;
	private tail: Node<T> | null = null;
	private currentSize: number = 0;
	private readonly maxSize: number;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
	}

	enqueue(item: T): boolean {
		if (this.currentSize >= this.maxSize) throw new Error("Queue is full");

		const node = new Node(item);
		if (this.tail) {
			this.tail.next = node;
			this.tail = node;
		} else {
			this.tail = this.head = node;
		}
		this.currentSize++;
		return true;
	}

	dequeue(): T | undefined {
		if (!this.head) return undefined;

		const value = this.head.value;
		this.head = this.head.next;

		if (!this.head) this.tail = null;
		this.currentSize--;
		return value;
	}

	peek(): T | undefined {
		return this.head?.value;
	}

	isEmpty(): boolean {
		return this.currentSize === 0;
	}

	isFull(): boolean {
		return this.currentSize >= this.maxSize;
	}

	size(): number {
		return this.currentSize;
	}

	clear(): void {
		this.head = null;
		this.tail = null;
		this.currentSize = 0;
	}
}
