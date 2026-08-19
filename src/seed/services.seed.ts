import { db } from "../config/firebase";

const services: any[] = []; // ← সব dummy ডাটা মুছে ফেলা হয়েছে

export async function seedServices() {
  console.log("Seeding Services...");

  for (const service of services) {
    const { id, ...data } = service;

    await db
      .collection("services")
      .doc(id)
      .set(
        {
          ...data,
          updatedAt: new Date(),
        },
        { merge: true }
      );
  }

  console.log("Services Synced");
}