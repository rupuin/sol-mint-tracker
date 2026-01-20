import type { Token } from "./providers/index.ts";

export type MintEvent = MintDetectedEvent | MintEnrichedEvent | MintErrorEvent;

export type DomainErrorContext = "detection" | "enrichment";

export interface MintDetectedEvent {
  launchpad: string;
  signature: string;
  timestamp: number;
}

export interface MintEnrichedEvent {
  launchpad: string;
  signature: string;
  token: Token;
  timestamp: number;
}

export interface MintErrorEvent {
  context: DomainErrorContext;
  launchpad: string;
  signature?: string;
  error: Error;
  timestamp: number;
}
