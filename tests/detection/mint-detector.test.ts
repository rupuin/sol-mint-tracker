import { beforeEach, describe, expect, it } from "vitest";
import {
	type DetectionFailed,
	Launchpad,
	type MintDetected,
	MintDetector,
} from "../../src/detection/index.ts";

describe("MintDetector", () => {
	const lp1 = new Launchpad("program1", "addr1", "instr1");
	const lp2 = new Launchpad("program2", "addr2", "instr2");

	let detector: MintDetector;
	let detected: MintDetected[];
	let errors: DetectionFailed[];

	beforeEach(() => {
		detector = new MintDetector([lp1, lp2]);
		detected = [];
		errors = [];

		detector.on("detected", (e) => detected.push(e));
		detector.on("error", (e) => errors.push(e));
	});

	describe("handleLog", () => {
		it("emits detected when log contains mint instruction", () => {
			detector.handleLog({
				source: lp1,
				signature: "abc123",
				logs: ["Program log: instr1"],
				timestamp: Date.now(),
			});

			expect(detected).toHaveLength(1);
			expect(detected[0]?.launchpad).toBe("program1");
			expect(detected[0]?.signature).toBe("abc123");
		});

		it("does not emit for non-mint transactions", () => {
			detector.handleLog({
				source: lp1,
				logs: ["Program log: Transfer"],
				signature: "sig",
				timestamp: Date.now(),
			});

			expect(detected).toHaveLength(0);
		});

		it("ignores events from unknown launchpads", () => {
			detector.handleLog({
				source: { name: "Unknown", address: "unknown-addr" },
				logs: ["instr1"],
				signature: "sig",
				timestamp: Date.now(),
			});

			expect(detected).toHaveLength(0);
		});

		it("detects mints from multiple launchpads", () => {
			detector.handleLog({
				source: lp1,
				signature: "sig1",
				logs: ["instr1"],
				timestamp: Date.now(),
			});
			detector.handleLog({
				source: lp2,
				signature: "sig2",
				logs: ["instr2"],
				timestamp: Date.now(),
			});

			expect(detected).toHaveLength(2);
			expect(detected[0]?.launchpad).toBe("program1");
			expect(detected[1]?.launchpad).toBe("program2");
		});
	});

	describe("handleError", () => {
		it("emits error with launchpad info", () => {
			const err = new Error("Connection lost");
			detector.handleError({
				context: "stream",
				source: lp1,
				error: err,
				timestamp: Date.now(),
			});

			expect(errors).toHaveLength(1);
			expect(errors[0]?.launchpad).toBe("program1");
			expect(errors[0]?.error).toBe(err);
		});
	});
});
