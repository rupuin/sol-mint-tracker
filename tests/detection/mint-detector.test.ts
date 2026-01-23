import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it } from "vitest";
import {
	type DetectionFailed,
	Launchpad,
	type MintDetected,
	MintDetector,
} from "../../src/detection/index.ts";
import type {
	LogReceived,
	LogSource,
	StreamFailed,
} from "../../src/providers/index.ts";

function logReceived(overrides: {
	source: LogSource;
	signature?: string;
	logs: string[];
}): LogReceived {
	return {
		signature: "test-sig",
		timestamp: Date.now(),
		...overrides,
	};
}

function streamFailed(overrides: {
	source: LogSource;
	error: Error;
}): StreamFailed {
	return {
		context: "stream",
		timestamp: Date.now(),
		...overrides,
	};
}

// Minimal LogStream stub - MintDetector only uses .on(), not start/stop
function createLogStreamStub() {
	const emitter = new EventEmitter();
	return Object.assign(emitter, {
		start: () => Promise.resolve(),
		stop: () => {},
	});
}

describe("MintDetector", () => {
	const pumpfun = new Launchpad(
		"PumpFun",
		"6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
		"Instruction: Create",
	);
	const raydium = new Launchpad(
		"Raydium",
		"LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj",
		"Instruction: InitializeMint",
	);

	let detector: MintDetector;
	let stream: ReturnType<typeof createLogStreamStub>;
	let detected: MintDetected[];
	let errors: DetectionFailed[];

	beforeEach(() => {
		detector = new MintDetector([pumpfun, raydium]);
		stream = createLogStreamStub();
		detected = [];
		errors = [];

		detector.on("detected", (e) => detected.push(e));
		detector.on("error", (e) => errors.push(e));
		detector.listenTo(stream);
	});

	describe("detection", () => {
		it("emits detected when log contains mint instruction", () => {
			stream.emit(
				"log",
				logReceived({
					source: { name: "PumpFun", address: pumpfun.address },
					signature: "abc123",
					logs: ["Program log: Instruction: Create"],
				}),
			);

			expect(detected).toHaveLength(1);
			expect(detected[0]?.launchpad).toBe("PumpFun");
			expect(detected[0]?.signature).toBe("abc123");
		});

		it("does not emit for non-mint transactions", () => {
			stream.emit(
				"log",
				logReceived({
					source: { name: "PumpFun", address: pumpfun.address },
					logs: ["Program log: Transfer"],
				}),
			);

			expect(detected).toHaveLength(0);
		});

		it("ignores events from unknown launchpads", () => {
			stream.emit(
				"log",
				logReceived({
					source: { name: "Unknown", address: "unknown-addr" },
					logs: ["Instruction: Create"],
				}),
			);

			expect(detected).toHaveLength(0);
		});

		it("detects mints from multiple launchpads", () => {
			stream.emit(
				"log",
				logReceived({
					source: { name: "PumpFun", address: pumpfun.address },
					signature: "sig1",
					logs: ["Instruction: Create"],
				}),
			);
			stream.emit(
				"log",
				logReceived({
					source: { name: "Raydium", address: raydium.address },
					signature: "sig2",
					logs: ["Instruction: InitializeMint"],
				}),
			);

			expect(detected).toHaveLength(2);
			expect(detected[0]?.launchpad).toBe("PumpFun");
			expect(detected[1]?.launchpad).toBe("Raydium");
		});
	});

	describe("error handling", () => {
		it("forwards stream errors as detection errors", () => {
			const err = new Error("Connection lost");
			stream.emit(
				"error",
				streamFailed({
					source: { name: "PumpFun", address: pumpfun.address },
					error: err,
				}),
			);

			expect(errors).toHaveLength(1);
			expect(errors[0]?.launchpad).toBe("PumpFun");
			expect(errors[0]?.error).toBe(err);
		});
	});
});
