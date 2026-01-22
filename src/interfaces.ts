import type {
	DetectionFailed,
	EnrichmentFailed,
	MintDetected,
	MintEnriched,
} from "./events.ts";

export interface MintDetectionEmitter {
	on(event: "detected", listener: (e: MintDetected) => void): this;
	on(event: "error", listener: (e: DetectionFailed) => void): this;
}

export interface MintEnrichmentEmitter {
	on(event: "enriched", listener: (e: MintEnriched) => void): this;
	on(
		event: "error",
		listener: (e: DetectionFailed | EnrichmentFailed) => void,
	): this;
}
