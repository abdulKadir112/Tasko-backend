import { db } from "../config/firebase";

const workers: any[] = []; // ← সব dummy ডাটা মুছে ফেলা হয়েছে

export async function seedWorkers() {
  console.log("Seeding Workers...");

  for (const worker of workers) {
    const { id, ...data } = worker;

    await db.collection("users").doc(id).set(
      {
        ...data,
        updatedAt: new Date(),
      },
      {
        merge: true,
      }
    );
  }

  console.log("Workers Synced");
}