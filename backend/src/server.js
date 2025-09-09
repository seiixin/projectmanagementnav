// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { database } from "./config/database.js";

// ----- Routes -----
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

// ---------- Config ----------
const PORT = Number(process.env.PORT) || 9100;

// Allowed web frontends for CORS
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://cvgeospatial.gghsoftwaredev.com",
  "https://www.cvgeospatial.gghsoftwaredev.com",
  process.env.CLIENT_URL, // fallback to env
].filter(Boolean); // remove undefined

// Trust proxy if behind Nginx/Cloudflare/etc.
app.set("trust proxy", 1);

// ---------- Middlewares ----------
app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Allow non-browser tools (no origin) and approved frontends
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ---------- Health ----------
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// ---------- DB Ping (non-fatal) ----------
(async () => {
  try {
    const [rows] = await database.query("SELECT 1 + 1 AS result");
    console.log("✅ DB OK. Test =", rows?.[0]?.result);
  } catch (err) {
    console.warn("⚠️  DB ping failed (server will still start):", err?.message);
  }
})();

// ---------- API Mounts ----------
app.use("/api/alameda", alamedaRoutes);
app.use("/api/ibaan", ibaanRoutes);
app.use("/api/landparcel", landParcelRoutes);
app.use("/api/user", userRoutes);
app.use("/api/building", buildingRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/landappraisal", landAppraisalRoutes);
app.use("/api/landassessment", landAssessmentRoutes);
app.use("/api/taxotherdetails", taxOtherDetailsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// ---------- Error Handler ----------
app.use((err, _req, res, _next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(err.status || 500).json({ error: err?.message || "Server error" });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(
    `🌐 Expected host: ${process.env.HOST || "http://localhost"}:${PORT}`
  );
  console.log(
    `🔐 CORS allowed: ${ALLOWED_ORIGINS.map((o) => new URL(o).host).join(", ")}`
  );
});
