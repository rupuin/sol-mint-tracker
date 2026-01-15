import dotenv from "dotenv";

import { HeliusService } from "./src/services/helius.ts";
import { LaunchLab } from "./src/programs/LaunchLab.ts";
import { PumpFun } from "./src/programs/PumpFun.ts";

dotenv.config();

const apiKey = process.env.HELIUS_API_KEY;

if (!apiKey) {
  throw new Error("Couln't fetch api key from env");
}

const launchLab = new LaunchLab();
// const pumpFun = new PumpFun();

const bonkTracker = new HeliusService(apiKey, [launchLab]);
// const pumpFunTracker = new HeliusService(apiKey, [pumpFun]);

bonkTracker.startTracking().catch((err) => {
  console.error("💥 Fatal Error in tracker:", err);
  process.exit(1);
});

// pumpFunTracker.startTracking().catch((err) => {
//   console.error("💥 Fatal Error in tracker:", err);
//   process.exit(1);
// });
