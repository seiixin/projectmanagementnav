// src/routes/taxRoute.js
import express from "express";
import {
  getAll,
  addNew,
  getById,
  editById,
  lookup,
} from "../controllers/taxController.js";

const router = express.Router();

// IMPORTANT: register /lookup BEFORE /:id
router.get("/", getAll);
router.get("/lookup", lookup);
router.post("/", addNew);
router.get("/:id", getById);
router.put("/:id", editById);

export default router;
