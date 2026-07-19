import "dotenv/config";
import { db } from "./index.js";
import { projects } from "./schema.js";

const SAMPLE_PROJECTS = [
  {
    title: "Airport Hills Residences",
    description:
      "A gated residential development of 24 three-bedroom townhouses near Kotoka International Airport, Accra. Pre-sales are underway with 60% of units reserved.",
    location: "Accra, Ghana",
    targetAmountGhs: "4800000",
    raisedAmountGhs: "1920000",
    minInvestmentGhs: "5000",
    expectedReturnPct: "18.5",
    durationMonths: "18",
  },
  {
    title: "Kumasi Central Retail Plaza",
    description:
      "Mixed-use retail and office complex in central Kumasi, anchored by two supermarket tenants on 15-year leases.",
    location: "Kumasi, Ghana",
    targetAmountGhs: "6200000",
    raisedAmountGhs: "3100000",
    minInvestmentGhs: "10000",
    expectedReturnPct: "16",
    durationMonths: "24",
  },
  {
    title: "Takoradi Harbor View Apartments",
    description:
      "48-unit mid-market apartment block serving the growing oil & gas workforce in Takoradi, with on-site parking and backup power.",
    location: "Takoradi, Ghana",
    targetAmountGhs: "3500000",
    raisedAmountGhs: "700000",
    minInvestmentGhs: "3000",
    expectedReturnPct: "14.5",
    durationMonths: "12",
  },
];

async function seed() {
  for (const project of SAMPLE_PROJECTS) {
    await db.insert(projects).values(project);
    console.log(`Inserted: ${project.title}`);
  }
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
