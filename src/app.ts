import express from "express";
import cors from "cors";

// =====================================================
// ROUTES
// =====================================================

import categoryRoutes from "./routes/category.routes";
import serviceRoutes from "./routes/service.routes";
import userRoutes from "./routes/user.routes";
import jobRoutes from "./routes/job.routes";
import bidRoutes from "./routes/bid.routes";
import bookingRoutes from "./routes/booking.routes";
import reviewRoutes from "./routes/review.routes";
import uploadRoutes from "./routes/upload.routes";
import chatRoutes from "./routes/chat.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";

// =====================================================
// MIDDLEWARE
// =====================================================

import { notFound } from "./middleware/notFound.middleware";
import { errorHandler } from "./middleware/error.middleware";

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: "*",
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json());

// =====================================================
// ROOT
// =====================================================

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "🚀 Service Marketplace API Running",
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/categories", categoryRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/users", userRoutes);

app.use("/api/jobs", jobRoutes);

app.use("/api/bids", bidRoutes);

// ⭐ BOOKING ROUTES
app.use("/api/bookings", bookingRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/chats", chatRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/notifications", notificationRoutes);

// =====================================================
// 404
// =====================================================

app.use(notFound);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(errorHandler);

export default app;