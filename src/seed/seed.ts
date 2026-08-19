import { seedCategories } from "./categories.seed";
import { seedServices } from "./services.seed";
import { seedWorkers } from "./workers.seed";

async function seedDatabase() {
  try {
    console.log("Starting Seeder...\n");

    await seedCategories();
    await seedServices();
    await seedWorkers();

    console.log("\nDatabase Seed Successful ✅");

    process.exit(0);
  } catch (error) {
    console.error("Seeder Error:", error);
    process.exit(1);
  }
}

seedDatabase();