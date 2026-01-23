import dotenv from "dotenv";
import {
	Launchpad,
	LaunchpadRegistry,
} from "./src/detection/launchpad-registry.ts";
import { MintDetector, MintEnricher } from "./src/index.ts";
import { createHeliusProvider } from "./src/providers/index.ts";

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

const logStream = helius.createLogStream({
	sources: launchpads.all(),
	commitment: "confirmed",
});
const tokenFetcher = helius.createTokenFetcher();

const detector = new MintDetector(launchpads.all());
const enricher = new MintEnricher(tokenFetcher);

detector.listenTo(logStream);
enricher.listenTo(detector);

detector.on("detected", (e) => console.log("Detected:", e.signature));
detector.on("error", (e) => console.error(e));
enricher.on("enriched", (e) =>
	console.log("Enriched:", JSON.stringify(e.token, null, 2)),
);
enricher.on("error", (e) => console.error(e));

logStream.start();
