import { describe, it, vi, expect, beforeEach } from "vitest";
import type { LogReceived, StreamFailed } from "../../../src/providers/types.ts";
import { HeliusLogStream } from "../../../src/providers/helius/log-stream.ts";

function mockHeliusClient() {
  return { ws: { logsNotifications: vi.fn() } };
}

function createMockSubscription(events: unknown[]) {
  return {
    subscribe: () =>
      (async function* () {
        for (const e of events) yield e;
      })(),
  };
}

describe("HeliusLogStream", () => {
  const source1 = { name: "PumpFun", address: "addr1" };
  const source2 = { name: "Raydium", address: "addr2" };

  let client: ReturnType<typeof mockHeliusClient>;
  let logEvents: LogReceived[];
  let errors: StreamFailed[];

  beforeEach(() => {
    client = mockHeliusClient();
    logEvents = [];
    errors = [];
  });

  function createStream(sources = [source1]) {
    const stream = new HeliusLogStream(client, sources, "confirmed");
    stream.on("log", (e) => logEvents.push(e));
    stream.on("error", (e) => errors.push(e));
    return stream;
  }

  describe("log emission", () => {
    it("emits log event for each notification", async () => {
      client.ws.logsNotifications.mockResolvedValue(
        createMockSubscription([
          { value: { signature: "sig1", logs: ["log line 1"] } },
          { value: { signature: "sig2", logs: ["log line 2"] } },
        ]),
      );

      const stream = createStream([source1]);
      await stream.start();

      expect(logEvents).toHaveLength(2);
      expect(logEvents[0]).toMatchObject({
        signature: "sig1",
        source: source1,
      });
      expect(logEvents[1]).toMatchObject({
        signature: "sig2",
        source: source1,
      });
    });

    it("emits logs from multiple sources independently", async () => {
      client.ws.logsNotifications.mockImplementation(() =>
        Promise.resolve(
          createMockSubscription([{ value: { signature: "sig", logs: [] } }]),
        ),
      );

      const stream = createStream([source1, source2]);
      await stream.start();

      expect(logEvents).toHaveLength(2);
      expect(logEvents.map((e) => e.source.name)).toContain("PumpFun");
      expect(logEvents.map((e) => e.source.name)).toContain("Raydium");
    });

    it("handles notification without value wrapper", async () => {
      client.ws.logsNotifications.mockResolvedValue(
        createMockSubscription([
          { signature: "sig1", logs: ["direct format"] },
        ]),
      );

      const stream = createStream([source1]);
      await stream.start();

      expect(logEvents).toHaveLength(1);
      expect(logEvents[0]?.signature).toBe("sig1");
    });
  });

  describe("error handling", () => {
    it("emits subscription error when connection fails", async () => {
      client.ws.logsNotifications.mockRejectedValue(
        new Error("Connection refused"),
      );

      const stream = createStream([source1]);
      await stream.start();

      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        context: "subscription",
        source: source1,
      });
      expect(errors[0]?.error.message).toBe("Connection refused");
    });

    it("emits stream error when iteration fails mid-stream", async () => {
      client.ws.logsNotifications.mockResolvedValue({
        subscribe: () =>
          (async function* () {
            yield { value: { signature: "sig1", logs: [] } };
            throw new Error("Stream disconnected");
          })(),
      });

      const stream = createStream([source1]);
      await stream.start();

      expect(logEvents).toHaveLength(1);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        context: "stream",
        source: source1,
      });
    });

    it("continues other sources when one fails to subscribe", async () => {
      let callCount = 0;
      client.ws.logsNotifications.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("First source failed"));
        }
        return Promise.resolve(
          createMockSubscription([{ value: { signature: "sig", logs: [] } }]),
        );
      });

      const stream = createStream([source1, source2]);
      await stream.start();

      expect(errors).toHaveLength(1);
      expect(logEvents).toHaveLength(1);
    });
  });

  describe("lifecycle", () => {
    it("stop() aborts active streams without emitting errors", async () => {
      client.ws.logsNotifications.mockResolvedValue({
        subscribe: (opts: { abortSignal: AbortSignal }) =>
          (async function* () {
            while (!opts.abortSignal.aborted) {
              yield { value: { signature: "sig", logs: [] } };
              await new Promise((r) => setTimeout(r, 10));
            }
          })(),
      });

      const stream = createStream([source1]);
      const startPromise = stream.start();

      await new Promise((r) => setTimeout(r, 50));
      stream.stop();

      await startPromise;

      expect(logEvents.length).toBeGreaterThan(0);
      expect(errors).toHaveLength(0);
    });
  });
});
