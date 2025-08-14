import express from 'express'
import { getAll, getById, editById, search, addNew} from '../controllers/ibaanController.js';
const router = express.Router();

router.get("/", getAll);
router.post("/", addNew);
router.get("/:id", getById);
router.put("/:id", editById);
router.get("/search/:value", search);

export default router;