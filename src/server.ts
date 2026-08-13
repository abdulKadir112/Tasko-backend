import dotenv from "dotenv";

dotenv.config();

import app from "./app";

const PORT = Number(process.env.PORT) || 5000;

console.log(
  "Cloudinary:",
  process.env.CLOUDINARY_CLOUD_NAME
    ? "Configured"
    : "Missing"
);

app.listen(PORT, "0.0.0.0", () => {
  console.log("==========================================");
  console.log(`🚀 Server Running On Port ${PORT}`);
  console.log(`🌐 LAN: http://192.168.0.117:${PORT}`);
  console.log("==========================================");
});