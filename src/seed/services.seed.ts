// import { db } from "../config/firebase";

// const services = [
//   {
//     id: "electrician",
//     title: "Electrician",
//     category: "electric",
//     price: 500,
//     rating: 4.9,
//     image: "",
//   },
//   {
//     id: "plumber",
//     title: "Professional Plumber",
//     category: "plumbing",
//     price: 400,
//     rating: 4.8,
//     image: "",
//   },
//   {
//     id: "painter",
//     title: "House Painter",
//     category: "painter",
//     price: 800,
//     rating: 4.7,
//     image: "",
//   },
//   {
//     id: "ac-technician",
//     title: "AC Technician",
//     category: "ac-repair",
//     price: 700,
//     rating: 4.9,
//     image: "",
//   },
//   {
//     id: "cleaner",
//     title: "Home Cleaning",
//     category: "cleaning",
//     price: 600,
//     rating: 4.8,
//     image: "",
//   },
//   {
//     id: "car-mechanic",
//     title: "Car Mechanic",
//     category: "car-repair",
//     price: 900,
//     rating: 4.9,
//     image: "",
//   },
// ];

// export async function seedServices() {
//   console.log("Seeding Services...");

//   for (const service of services) {
//     const { id, ...data } = service;

//     await db
//       .collection("services")
//       .doc(id)
//       .set(
//         {
//           ...data,
//           updatedAt: new Date(),
//         },
//         { merge: true }
//       );
//   }

//   console.log("Services Synced");
// }