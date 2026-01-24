import dotenv from "dotenv";
import {
	Launchpad,
	LaunchpadRegistry,
} from "./src/detection/launchpad-registry.ts";
import { MintDetector, MintEnricher, type MintDetected } from "./src/index.ts";
import { createHeliusProvider } from "./src/providers/index.ts";
import { AsyncQueueProcessor } from "./src/utils/queue/async-queue-processor.ts";

dotenv.config();

const apiKey = process.env.HELIUS_API_KEY;
if (!apiKey) {
	throw new Error("HELIUS_API_KEY not found in environment");
}

const helius = createHeliusProvider(apiKey);

const launchpads = new LaunchpadRegistry();
launchpads.add(
	new Launchpad(
		"PumpFun",
		"6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
		"Instruction: CreateV2",
	),
);
launchpads.add(
	new Launchpad(
		"Raydium LaunchLab",
		"LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj",
		"Instruction: InitializeMint2",
	),
);

const logStream = helius.createLogStream({
	sources: launchpads.all(),
	commitment: "confirmed",
});
const tokenFetcher = helius.createTokenFetcher();

const detector = new MintDetector(launchpads.all());
const enricher = new MintEnricher(tokenFetcher);

const queue = new AsyncQueueProcessor(
	(item) => enricher.handleDetection(item as MintDetected),
	{ concurrency: 2 },
);

logStream.on("log", (e) => detector.handleLog(e));
logStream.on("error", (e) => detector.handleError(e));

detector.on("detected", (e) => queue.enqueue(e));
detector.on("error", (e) => console.error(e));

enricher.on("enriched", (e) => console.log(e));
enricher.on("error", (e) => console.error(e));

queue.start();
logStream.start();

// shutdown
process.on("SIGINT", async () => {
	console.log("\nShutting down...");
	logStream.stop();
	queue.stop();
	await queue.drain();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("\nShutting down...");
	logStream.stop();
	queue.stop();
	await queue.drain();
	process.exit(0);
});
