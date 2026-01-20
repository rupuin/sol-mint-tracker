import dotenv from "dotenv";

import { providers } from "./src/providers/index.ts";
import { Launchpad, LaunchpadRegistry } from "./src/launchpads.ts";
import { MintDetector, MintEnricher, type MintEvent } from "./src/index.ts";

dotenv.config();

const apiKey = process.env.HELIUS_API_KEY;

if (!apiKey) {
  throw new Error("HELIUS_API_KEY not found in environment");
}

const launchpads = new LaunchpadRegistry();
launchpads.add(
  new Launchpad(
    "PumpFun",
    "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
    "Instruction: InitializeMint",
  ),
);
launchpads.add(
  new Launchpad(
    "Raydium LaunchLab",
    "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj",
    "Instruction: InitializeMint",
  ),
);

const logStreamer = providers.createLogStreamer("helius", { apiKey });
const tokenFetcher = providers.createTokenFetcher("helius", { apiKey });

const logStream = logStreamer.createStream({
  sources: launchpads.all(),
  commitment: "confirmed",
});

const detector = new MintDetector(launchpads.all());
const enricher = new MintEnricher(tokenFetcher);

detector.attachTo(logStream);
enricher.attachTo(detector);

detector.on("detected", (e) => console.log("Detected:", e.signature));
detector.on("error", (e) => console.error(e));
enricher.on("enriched", (e) =>
  console.log("Enriched:", JSON.stringify(e.token, null, 2)),
);
enricher.on("error", (e) => console.error(e));
console.log("******************************************************");
logStream.start();
