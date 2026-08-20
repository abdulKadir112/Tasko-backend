import { db } from "../config/firebase";

const categories = [
  // --- আপনার আগের ক্যাটাগরিগুলো ---
  {
    id: "electric",
    title: "Electric",
    emoji: "⚡",
    icon: "flash",
    color: "#FEF3C7",
  },
  {
    id: "plumbing",
    title: "Plumbing",
    emoji: "🚿",
    icon: "water",
    color: "#DBEAFE",
  },
  {
    id: "painter",
    title: "Painter",
    emoji: "🎨",
    icon: "color-palette",
    color: "#F3E8FF",
  },
  {
    id: "ac-repair",
    title: "AC Repair",
    emoji: "❄️",
    icon: "snow",
    color: "#EFF6FF",
  },
  {
    id: "cleaning",
    title: "Cleaning",
    emoji: "🧹",
    icon: "sparkles",
    color: "#ECFCCB",
  },
  {
    id: "car-repair",
    title: "Car Repair",
    emoji: "🚗",
    icon: "car",
    color: "#FEF2F2",
  },
  {
    id: "mechanic",
    title: "Mechanic",
    emoji: "🔧",
    icon: "construct",
    color: "#E0F2FE",
  },
  {
    id: "home-service",
    title: "Home Service",
    emoji: "🏠",
    icon: "home",
    color: "#F5F3FF",
  },

  // --- নতুন প্রয়োজনীয় ক্যাটাগরিগুলো ---
  {
    id: "appliance-repair",
    title: "Appliance Repair",
    emoji: "🔌",
    icon: "hardware-chip",
    color: "#FEF3C7", // ফ্রিজ, ওভেন, ওয়াশিং মেশিন মেরামত
  },
  {
    id: "pest-control",
    title: "Pest Control",
    emoji: "🪳",
    icon: "bug",
    color: "#FEE2E2", // পোকা-মাকড় দমন
  },
  {
    id: "carpenter",
    title: "Carpenter",
    emoji: "🪚",
    icon: "hammer",
    color: "#FFEDD5", // কাঠ মিস্ত্রি
  },
  {
    id: "laundry",
    title: "Laundry & Dry Clean",
    emoji: "🧺",
    icon: "shirt",
    color: "#FCE7F3", // কাপড় ধোয়া ও আইরন
  },
  {
    id: "beauty-salon",
    title: "Beauty & Salon",
    emoji: "✂️",
    icon: "cut",
    color: "#FDF2F8", // পার্লার ও সেলুন সার্ভিস
  },
  {
    id: "shifting-mover",
    title: "Shifting & Movers",
    emoji: "📦",
    icon: "cube",
    color: "#E0E7FF", // বাসা বা অফিস বদল
  },
  {
    id: "cctv-security",
    title: "CCTV & Security",
    emoji: "📹",
    icon: "videocam",
    color: "#F1F5F9", // সিকিউরিটি ক্যামেরা সেটআপ
  },
  {
    id: "gardening",
    title: "Gardening",
    emoji: "🪴",
    icon: "leaf",
    color: "#DCFCE7", // বাগান পরিচর্যা
  },
];

export async function seedCategories() {
  console.log("Seeding Categories...");

  for (const category of categories) {
    const { id, ...data } = category;

    await db
      .collection("categories")
      .doc(id)
      .set(
        {
          ...data,
          updatedAt: new Date(),
        },
        { merge: true }
      );
  }

  console.log("Categories Synced");
}