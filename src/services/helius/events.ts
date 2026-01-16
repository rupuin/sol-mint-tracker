export type HeliusEvent = HeliusLogEvent | HeliusErrorEvent;

export interface HeliusLogEvent {
  type: "helius:log";
  program: string;
  signature: string;
  rawLog: any;
  timestamp: number;
}

export interface HeliusErrorEvent {
  type: "helius:error";
  context: "subscription" | "stream" | "processing";
  program?: string;
  signature?: string;
  error: Error;
  timestamp: number;
}
