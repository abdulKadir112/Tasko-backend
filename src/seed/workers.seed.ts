// import { db } from "../config/firebase";

// const workers = [
//   {
//     id: "worker-electric-1",
//     name: "Rahim Electrician",
//     role: "worker",
//     category: "electric",
//     city: "Kushtia",
//     phone: "01700000001",
//     rating: 4.9,
//     completedJobs: 152,
//     experience: "6 Years",
//     price: 500,
//     photoURL: "",
//     address: "Kushtia Sadar",
//   },

//   {
//     id: "worker-electric-2",
//     name: "Karim Electrician",
//     role: "worker",
//     category: "electric",
//     city: "Kushtia",
//     phone: "01700000002",
//     rating: 4.8,
//     completedJobs: 89,
//     experience: "4 Years",
//     price: 450,
//     photoURL: "",
//     address: "Mirpur",
//   },

//   {
//     id: "worker-plumbing-1",
//     name: "Sohag Plumber",
//     role: "worker",
//     category: "plumbing",
//     city: "Kushtia",
//     phone: "01700000003",
//     rating: 4.9,
//     completedJobs: 190,
//     experience: "7 Years",
//     price: 400,
//     photoURL: "",
//     address: "Bheramara",
//   },

//   {
//     id: "worker-painter-1",
//     name: "Hasan Painter",
//     role: "worker",
//     category: "painter",
//     city: "Kushtia",
//     phone: "01700000004",
//     rating: 4.7,
//     completedJobs: 63,
//     experience: "5 Years",
//     price: 800,
//     photoURL: "",
//     address: "Khoksa",
//   },

//   {
//     id: "worker-cleaning-1",
//     name: "Rasel Cleaner",
//     role: "worker",
//     category: "cleaning",
//     city: "Kushtia",
//     phone: "01700000005",
//     rating: 4.8,
//     completedJobs: 120,
//     experience: "3 Years",
//     price: 600,
//     photoURL: "",
//     address: "Kumarkhali",
//   },

//   {
//     id: "worker-ac-1",
//     name: "Masud AC Technician",
//     role: "worker",
//     category: "ac-repair",
//     city: "Kushtia",
//     phone: "01700000006",
//     rating: 4.9,
//     completedJobs: 210,
//     experience: "8 Years",
//     price: 700,
//     photoURL: "",
//     address: "Kushtia",
//   },

//   {
//     id: "worker-car-1",
//     name: "Jamal Car Mechanic",
//     role: "worker",
//     category: "car-repair",
//     city: "Kushtia",
//     phone: "01700000007",
//     rating: 4.9,
//     completedJobs: 340,
//     experience: "10 Years",
//     price: 900,
//     photoURL: "",
//     address: "Kushtia",
//   },
// ];

// export async function seedWorkers() {
//   console.log("Seeding Workers...");

//   for (const worker of workers) {
//     const { id, ...data } = worker;

//     await db.collection("users").doc(id).set(
//       {
//         ...data,
//         updatedAt: new Date(),
//       },
//       {
//         merge: true,
//       }
//     );
//   }

//   console.log("Workers Synced");
// }