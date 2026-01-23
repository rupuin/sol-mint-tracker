import { beforeEach, describe, expect, it } from "vitest";
import { LinkedQueue } from "../../../src/utils/queue/linked-queue.ts";
import type { Queue } from "../../../src/utils/queue/types.ts";

describe("LinkedQueue", () => {
	const createQueue = <T>(maxSize = 10) => new LinkedQueue<T>(maxSize);

	describe("with items", () => {
		let queue: Queue<number>;

		beforeEach(() => {
			queue = createQueue<number>();
			queue.enqueue(1);
			queue.enqueue(2);
			queue.enqueue(3);
		});

		it("deques in FIFO order", () => {
			expect(queue.dequeue()).toBe(1);
			expect(queue.dequeue()).toBe(2);
			expect(queue.dequeue()).toBe(3);
		});

		it("tracks the size correctly", () => {
			expect(queue.size()).toBe(3);
			queue.dequeue();
			expect(queue.size()).toBe(2);
		});

		it("peeks at the head node value", () => {
			expect(queue.peek()).toBe(1);
		});
	});

	describe("when full", () => {
		const maxSize = 2;
		let queue: Queue<string>;

		beforeEach(() => {
			queue = createQueue<string>(maxSize);
			queue.enqueue("a");
			queue.enqueue("b");
		});

		it("throws an error on enqueue", () => {
			expect(() => queue.enqueue("c")).toThrowError("Queue is full");
		});

		it("returns true on isFull", () => {
			expect(queue.isFull()).toBe(true);
		});

		it("allows to dequeue", () => {
			expect(queue.dequeue()).toBe("a");
		});
	});

	describe("when empty", () => {
		let queue: Queue<unknown>;

		beforeEach(() => {
			queue = createQueue<unknown>();
		});

		it("returns undefined on dequeue", () => {
			expect(queue.dequeue()).toBeUndefined();
		});

		it("returns true on isEmpty", () => {
			expect(queue.isEmpty()).toBe(true);
		});

		it("has size 0", () => {
			expect(queue.size()).toBe(0);
		});
	});

	describe("when cleared", () => {
		it("becomes empty", () => {
			const queue = createQueue();
			queue.enqueue(10);
			queue.enqueue(11);

			queue.clear();
			expect(queue.peek()).toBeUndefined;
			expect(queue.isEmpty()).toBe(true);
		});
	});
});
