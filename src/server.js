require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

// ======================
// 🔥 CORS (MUHIMU SANA)
// ======================
app.use(cors({
  origin: ["http://localhost:5173"], // frontend yako
  credentials: true
}));

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());

// ======================
// STATIC FOLDER (IMAGES)
// ======================
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ======================
// ROUTES
// ======================
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const hostRoutes = require("./routes/hostRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/host", hostRoutes);

// ======================
// TEST ROUTE
// ======================
app.get("/", (req, res) => {
  res.send("KNOCK-IN API running...");
});

// ======================
// ❌ NOT FOUND HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// ======================
// 🔥 GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({
    message: err.message || "Server error"
  });
});

// ======================
// DB CONNECT + CLEANUP
// ======================
const { cleanupExpiredBookings } = require("./controllers/bookingController");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    setInterval(() => {
      cleanupExpiredBookings();
    }, 5 * 60 * 1000);
  })
  .catch(err => console.log(err));

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});