import { EventEmitter } from "events";
import type {
  LogStream,
  RawLogEvent,
  StreamErrorEvent,
} from "./providers/index.ts";
import type { Launchpad } from "./launchpads.ts";
import type { MintDetectedEvent, MintErrorEvent } from "./events.ts";

/**
 * Detects new mints from raw log events using launchpad-specific patterns
 */
export class MintDetector extends EventEmitter {
  on(e: "detected", listener: (e: MintDetectedEvent) => void): this;
  on(e: "error", listener: (e: MintErrorEvent) => void): this;
  on(e: string, listener: (...args: any[]) => void): this {
    return super.on(e, listener);
  }

  // Optional: overload emit too
  // emit(event: "detected", payload: MintDetectedEvent): boolean;
  // emit(event: "error", payload: MintErrorEvent): boolean;
  // emit(event: string, ...args: any[]): boolean {
  //   return super.emit(event, ...args);
  // }

  private launchpads: Map<string, Launchpad>;

  constructor(launchpads: Launchpad[]) {
    super();
    this.launchpads = new Map(launchpads.map((l) => [l.name, l]));
  }

  public attachTo(logStream: LogStream): void {
    logStream.on("log", (e) => this.handleLog(e));
    logStream.on("error", (e) => this.handleError(e));
  }

  private handleLog(e: RawLogEvent): void {
    const launchpad = this.launchpads.get(e.source.name);

    if (!launchpad) return; // TODO: err handling
    if (this.isMint(e.logs, launchpad.mintInstruction)) {
      this.emit("detected", {
        launchpad: e.source.name,
        signature: e.signature,
        timestamp: e.timestamp,
      } satisfies MintDetectedEvent);
    }
  }

  private handleError(e: StreamErrorEvent): void {
    this.emit("error", {
      context: "detection",
      launchpad: e.source.name,
      error: e.error,
      timestamp: e.timestamp,
      ...(e.signature !== undefined && { signature: e.signature }),
    } satisfies MintErrorEvent);
  }

  /**
   * Checks if program logs contain the mint instruction pattern
   */
  private isMint(logs: string[], mintInstruction: string): boolean {
    return logs.some((line) => line.includes(mintInstruction));
  }
}
