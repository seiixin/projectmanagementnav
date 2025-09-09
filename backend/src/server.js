// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { database } from "./config/database.js";

// Routes
import alamedaRoutes from "./routes/alamedaRoute.js";
import ibaanRoutes from "./routes/ibaanRoute.js";
import landParcelRoutes from "./routes/landParcelRoute.js";
import userRoutes from "./routes/userRoute.js";
import buildingRoutes from "./routes/buildingRoutes.js";
import taxRoutes from "./routes/taxRoute.js";
import landAppraisalRoutes from "./routes/landAppraisalRoute.js";
import landAssessmentRoutes from "./routes/landAssessmentRoutes.js";
import taxOtherDetailsRoutes from "./routes/taxOtherDetailsRoutes.js";
import auditLogsRoutes from "./routes/auditLogsRoute.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 9100;

// ---------- Middlewares ----------
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ---------- Health Check ----------
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// ---------- Database Ping ----------
(async () => {
  try {
    const [rows] = await database.query("SELECT 1 + 1 AS result");
    console.log("✅ DB OK. Test =", rows?.[0]?.result);
  } catch (err) {
    console.warn("⚠️  DB ping failed (server still starting):", err.message);
  }
})();

// ---------- Mount APIs ----------
app.use("/api/alameda", alamedaRoutes);
app.use("/api/ibaan", ibaanRoutes);
app.use("/api/landparcel", landParcelRoutes);
app.use("/api/user", userRoutes); // e.g. POST /api/user/login
app.use("/api/building", buildingRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/landappraisal", landAppraisalRoutes);
app.use("/api/landassessment", landAssessmentRoutes);
app.use("/api/taxotherdetails", taxOtherDetailsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);

// ---------- 404 & Error Handlers ----------
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ error: err?.message || "Server error" });
});

// ---------- Start Server ----------
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
