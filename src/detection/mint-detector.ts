import { EventEmitter } from "node:events";
// import type { LogStream } from "../providers/types.ts";
import type { LogReceived, StreamFailed } from "../types.ts";
import type { Launchpad } from "./launchpad-registry.ts";
import type {
	DetectionFailed,
	MintDetected,
	MintDetectionEmitter,
} from "./types.ts";

export class MintDetector extends EventEmitter implements MintDetectionEmitter {
	private launchpads: Map<string, Launchpad>;

	constructor(launchpads: Launchpad[]) {
		super();
		this.launchpads = new Map(launchpads.map((l) => [l.name, l]));
	}

	handleLog(e: LogReceived): void {
		const launchpad = this.launchpads.get(e.source.name);
		if (!launchpad) return;

		if (this.isMint(e.logs, launchpad.mintInstruction)) {
			this.emit("detected", {
				launchpad: e.source.name,
				signature: e.signature,
				timestamp: e.timestamp,
			} satisfies MintDetected);
		}
	}

	handleError(e: StreamFailed): void {
		this.emit("error", {
			launchpad: e.source.name,
			error: e.error,
			timestamp: e.timestamp,
		} satisfies DetectionFailed);
	}

	private isMint(logs: string[], mintInstruction: string): boolean {
		return logs.some((line) => line.includes(mintInstruction));
	}
}
