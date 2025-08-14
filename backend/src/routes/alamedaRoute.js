import express from 'express'
import { getAlamedaById, getAllAlameda, search, editAlamedaById } from '../controllers/alamedaController.js';
const router = express.Router();

router.get("/", getAllAlameda);
router.get("/:id", getAlamedaById);
router.put("/:id", editAlamedaById);
router.get("/search/:value", search);

export default router;