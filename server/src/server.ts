import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import rateLimit from "./middleware/rateLimit";

dotenv.config();

// Verify the Supabase connection is configured (throws early with a clear
// message if server/.env is missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
import "./db/supabase";

import authRoutes from "./routes/authRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import vesselRoutes from "./routes/vesselRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import userRoutes from "./routes/userRoutes";
import auditRoutes from "./routes/auditRoutes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth/login", rateLimit);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/vessels", vesselRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit-log", auditRoutes);

app.use("/api", notFound);

// In production, serve the built React app from the same Express server so
// only one service needs to be deployed (Render/Railway/Fly, etc.).
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || "4000", 10);
app.listen(PORT, () => {
  console.log(`Veymandoo Dhaftharu API listening on port ${PORT}`);
});
