import express from 'express'
import { getAll, addNew, getById, editById} from '../controllers/taxController.js';
const router = express.Router();

router.get("/", getAll);
router.post("/", addNew);
router.get("/:id", getById);
router.put("/:id", editById);

export default router;