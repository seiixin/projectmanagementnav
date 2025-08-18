import express from 'express'
import { addNew, getAll, getById, editById } from '../controllers/buildingController.js';

const router = express.Router();

router.post("/", addNew);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", editById);

export default router;