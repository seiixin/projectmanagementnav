// backend/src/routes/auditLogsRoutes.js
import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLogsController.js";

const router = Router();

// If you have auth middleware, put it here: router.use(authMiddleware);
router.get("/", getAuditLogs);

export default router;
