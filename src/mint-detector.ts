import { EventEmitter } from "events";
import type {
  LogStream,
  LogReceived,
  StreamFailed,
} from "./providers/index.ts";
import type { Launchpad } from "./launchpad.ts";
import type { MintDetected, DetectionFailed } from "./events.ts";
import type { MintDetectionEmitter } from "./interfaces.ts";

export class MintDetector extends EventEmitter implements MintDetectionEmitter {
  private launchpads: Map<string, Launchpad>;

  constructor(launchpads: Launchpad[]) {
    super();
    this.launchpads = new Map(launchpads.map((l) => [l.name, l]));
  }

  listenTo(logStream: LogStream): void {
    logStream.on("log", (e) => this.handleLog(e));
    logStream.on("error", (e) => this.handleError(e));
  }

  private handleLog(e: LogReceived): void {
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

  private handleError(e: StreamFailed): void {
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
