// import { db } from "../config/firebase";

// const categories = [
//   {
//     id: "electric",
//     title: "Electric",
//     emoji: "⚡",
//     icon: "flash",
//     color: "#FEF3C7",
//   },
//   {
//     id: "plumbing",
//     title: "Plumbing",
//     emoji: "🚿",
//     icon: "water",
//     color: "#DBEAFE",
//   },
//   {
//     id: "painter",
//     title: "Painter",
//     emoji: "🎨",
//     icon: "color-palette",
//     color: "#F3E8FF",
//   },
//   {
//     id: "ac-repair",
//     title: "AC Repair",
//     emoji: "❄️",
//     icon: "snow",
//     color: "#EFF6FF",
//   },
//   {
//     id: "cleaning",
//     title: "Cleaning",
//     emoji: "🧹",
//     icon: "sparkles",
//     color: "#ECFCCB",
//   },
//   {
//     id: "car-repair",
//     title: "Car Repair",
//     emoji: "🚗",
//     icon: "car",
//     color: "#FEF2F2",
//   },
//   {
//     id: "mechanic",
//     title: "Mechanic",
//     emoji: "🔧",
//     icon: "construct",
//     color: "#E0F2FE",
//   },
//   {
//     id: "home-service",
//     title: "Home Service",
//     emoji: "🏠",
//     icon: "home",
//     color: "#F5F3FF",
//   },
// ];

// export async function seedCategories() {
//   console.log("Seeding Categories...");

//   for (const category of categories) {
//     const { id, ...data } = category;

//     await db
//       .collection("categories")
//       .doc(id)
//       .set(
//         {
//           ...data,
//           updatedAt: new Date(),
//         },
//         { merge: true }
//       );
//   }

//   console.log("Categories Synced");
// }