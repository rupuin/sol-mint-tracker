import { describe, it, expect, beforeEach } from "vitest";
import { Launchpad, LaunchpadRegistry } from "../src/launchpad-registry.ts";

describe("LaunchpadRegistry", () => {
	const lp1 = new Launchpad("launch1", "addr1", "Instruction: Create");
	const lp2 = new Launchpad("launch2", "addr2", "Instruction: NewToken");
	let registry: LaunchpadRegistry;

	beforeEach(() => {
		registry = new LaunchpadRegistry();
	});

	describe("add", () => {
		it("registers new Launchpad", () => {
			registry.add(lp1);

			expect(registry.all()).toHaveLength(1);
			expect(registry.all()[0]?.name).toBe("launch1");
		});
	});

	describe("remove", () => {
		it("deletes Launchpad from registry when it exists", () => {
			registry.add(lp1);

			expect(registry.remove("launch1")).toBe(true);
			expect(registry.all()).toEqual([]);
		});

		it("returns false when Launchpad doesn't exist", () => {
			expect(registry.remove("some-name")).toBe(false);
		});
	});

	describe("getByName", () => {
		it("returns Launchpad object when it exists", () => {
			registry.add(lp1);
			registry.add(lp2);

			expect(registry.getByName("launch1")).toBeInstanceOf(Launchpad);
			expect(registry.getByName("launch2")?.address).toBe("addr2");
		});

		it("returns null when no Launchpad was found", () => {
			expect(registry.getByName("some-name")).toBeNull;
		});
	});

	describe("all", () => {
		it("returns an array of Launchpad objects when they exist", () => {
			registry.add(lp1);
			expect(registry.all()).toHaveLength(1);
			expect(registry.all()).toBeInstanceOf(Array);
		});

		it("returns an empty aray when there are no Launchpads", () => {
			expect(registry.all()).toEqual([]);
		});
	});
});
