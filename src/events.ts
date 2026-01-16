export type EventName = (typeof Events)[keyof typeof Events];

export const Events = {
  // domain
  MINT_DETECTED: "mintDetected",
  TOKEN_DISCOVERED: "tokenDiscovered",
  DISCOVERY_FAILED: "discoveryFailed", // where used?

  // infra
  SUBSCRIPTION_ERROR: "subscriptionError",
  LOG_PROCESSING_ERROR: "logProcessingError",
} as const;

// success events
interface BaseEvent {
  program: string;
  timestamp: number;
}

export interface MintDetectedEvent extends BaseEvent {
  signature: string;
}

// error events
interface BaseErrorEvent {
  program: string;
  error: Error;
  timestamp: number;
}

export interface SubscriptionErrorEvent extends BaseErrorEvent {}

export interface LogProcessingErrorEvent extends BaseErrorEvent {
  signature?: string;
}
