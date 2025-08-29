// backend/src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { database } from "./config/database.js";

// Routes...
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

dotenv.config({ override: true });

const app = express();
const ENV = process.env.NODE_ENV || "development";
const port = Number(process.env.PORT || 5000);

// --- CORS allow-list (exact origins, no trailing slashes) ---
const ALLOW = [
  "https://app-gis.gghsoftwaredev.com",
  "https://api-gis.gghsoftwaredev.com",
  "http://localhost:5173",
];

// Help caches/CDNs pick correct variant
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

// (Optional) quick visibility of what origin is hitting you
app.use((req, _res, next) => {
  if (req.headers.origin) console.log("ORIGIN:", req.headers.origin);
  next();
});

// Strong, predictable CORS behavior
app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser / same-origin / curl/postman (no Origin header)
      if (!origin) return cb(null, true);
      if (ALLOW.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Fast-track preflight requests
app.options("*", cors());

// Security & performance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

// Logging & body parsing
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(morgan(ENV === "production" ? "combined" : "dev"));

// Root: quick human-friendly hint that server is up
app.get("/", (_req, res) =>
  res.json({
    ok: true,
    message: "🚀 API server is up and running!",
    env: ENV,
    ts: new Date().toISOString(),
    health: "/api/health",
  })
);

// Health check
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString(), env: ENV })
);

// Optional: avoid browser console 404 for /favicon.ico
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// DB ping (non-fatal)
try {
  const [rows] = await database.query("SELECT 1 + 1 AS result");
  if (ENV !== "test") console.log("✅ DB OK. Test =", rows?.[0]?.result);
} catch (err) {
  console.warn("⚠️  DB ping failed:", err.message);
}

// Routes
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

// 404
app.use((req, res) =>
  res.status(404).json({ error: "Not found", path: req.originalUrl })
);

// CORS-specific error → clear 403 with origin info
app.use((err, req, res, next) => {
  if (err?.message === "Not allowed by CORS") {
    return res
      .status(403)
      .json({ error: "CORS forbidden", origin: req.headers.origin || null });
  }
  return next(err);
});

// Fallback error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err?.message || "Server error" });
});

// Start server
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 API listening on port ${port} (${ENV})`);
});

// Graceful shutdown
const shutdown = async (sig) => {
  console.log(`${sig} received. Shutting down...`);
  server.close(async () => {
    try {
      await database.end();
    } catch {}
    process.exit(0);
  });
};
["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
