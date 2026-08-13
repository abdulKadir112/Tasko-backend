import { db } from "../config/firebase";

export async function updateWorkerRating(
  workerId: string
) {
  const snapshot = await db
    .collection("reviews")
    .where("workerId", "==", workerId)
    .get();

  let totalReviews = snapshot.size;

  let totalRating = 0;

  snapshot.forEach((doc) => {
    const review = doc.data();

    totalRating += review.rating;
  });

  const averageRating =
    totalReviews === 0
      ? 0
      : Number(
          (
            totalRating / totalReviews
          ).toFixed(1)
        );

  await db
    .collection("users")
    .doc(workerId)
    .update({
      averageRating,
      totalReviews,
      updatedAt: new Date(),
    });
}