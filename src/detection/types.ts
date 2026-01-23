/**
 * Emitted when a mint transaction is detected from a launchpad
 */
export interface MintDetected {
	launchpad: string;
	signature: string;
	timestamp: number;
}

/**
 * Emitted when detection fails (e.g., stream error)
 */
export interface DetectionFailed {
	launchpad: string;
	error: Error;
	timestamp: number;
}

/**
 * Event emitter interface for mint detection
 */
export interface MintDetectionEmitter {
	on(event: "detected", listener: (e: MintDetected) => void): this;
	on(event: "error", listener: (e: DetectionFailed) => void): this;
}
