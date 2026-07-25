import "dotenv/config";
import { db } from "./index.js";
import { projects } from "./schema.js";

const TIER_PACKAGES = [
  { title: "Studio", minInvestmentGhs: "50", expectedReturnPct: "15", durationDays: "14" },
  { title: "Apartment", minInvestmentGhs: "150", expectedReturnPct: "18", durationDays: "21" },
  { title: "Townhouse", minInvestmentGhs: "400", expectedReturnPct: "20", durationDays: "30" },
  { title: "Duplex", minInvestmentGhs: "1000", expectedReturnPct: "25", durationDays: "30" },
  { title: "Villa", minInvestmentGhs: "2500", expectedReturnPct: "28", durationDays: "45" },
  { title: "Penthouse", minInvestmentGhs: "5000", expectedReturnPct: "32", durationDays: "60" },
  { title: "Estate", minInvestmentGhs: "10000", expectedReturnPct: "35", durationDays: "60" },
  { title: "Tower", minInvestmentGhs: "25000", expectedReturnPct: "38", durationDays: "90" },
  { title: "Skyline", minInvestmentGhs: "50000", expectedReturnPct: "42", durationDays: "90" },
  { title: "Landmark", minInvestmentGhs: "100000", expectedReturnPct: "50", durationDays: "120" },
];

async function seed() {
  for (const tier of TIER_PACKAGES) {
    await db.insert(projects).values({
      title: tier.title,
      description: "",
      location: "",
      targetAmountGhs: tier.minInvestmentGhs,
      minInvestmentGhs: tier.minInvestmentGhs,
      expectedReturnPct: tier.expectedReturnPct,
      durationDays: tier.durationDays,
    });
    console.log(`Inserted: ${tier.title}`);
  }
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
