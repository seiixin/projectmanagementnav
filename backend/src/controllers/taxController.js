// src/controllers/taxController.js
import { database } from "../config/database.js";
import { formatDate } from "../lib/utils.js";

/** GET /api/tax (optionally filter by parcelId or lotNo+barangay) */
export async function getAll(req, res) {
  try {
    const { parcelId, lotNo, barangay } = req.query;

    let sql = "SELECT * FROM tax_forms";
    const params = [];

    if (parcelId) {
      sql += " WHERE parcelId = ?";
      params.push(parcelId);
    } else if (lotNo) {
      sql += " WHERE lotNo = ?";
      params.push(lotNo);
      if (barangay) {
        sql += " AND barangay = ?";
        params.push(barangay);
      }
    }

    const [rows] = await database.query(sql, params);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No tax record found" });
    }
    res.json(rows);
  } catch (err) {
    console.error("getAll error:", err);
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/tax */
export async function addNew(req, res) {
  const data = req.body;
  try {
    const sql = `
      INSERT INTO tax_forms (
        arpNo, tdPrinted, municipalCode, accountNo, ownerName, ownerAddress,
        administrator, adminAddress, north, east, south, west,
        propertyIndexNo, subdivision, phase, lotNo, tdPrintedNo,
        houseNo, street, landmark, barangay, barangayOnPrint, barangayText,
        octNo, dated, surveyNo, cadLotNo, lotNo2, blockNo, parcelId
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const [result] = await database.query(sql, [
      data.arpNo,
      data.tdPrinted,
      data.municipalCode,
      data.accountNo,
      data.ownerName,
      data.ownerAddress,
      data.administrator,
      data.adminAddress,
      data.north,
      data.east,
      data.south,
      data.west,
      data.propertyIndexNo,
      data.subdivision,
      data.phase,
      data.lotNo,
      data.tdPrintedNo,
      data.houseNo,
      data.street,
      data.landmark,
      data.barangay,
      data.barangayOnPrint,
      data.barangayText,
      data.octNo,
      formatDate(data.dated) || null,
      data.surveyNo,
      data.cadLotNo,
      data.lotNo2,
      data.blockNo,
      data.parcelId || null
    ]);
    res.json({ message: "Tax added successfully", insertId: result.insertId });
  } catch (err) {
    console.error("addNew error:", err);
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/tax/:id */
export async function getById(req, res) {
  try {
    const [rows] = await database.execute(
      "SELECT * FROM tax_forms WHERE id = ?",
      [req.params.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Data not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getById error:", err);
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/tax/:id */
export async function editById(req, res) {
  try {
    const data = req.body;
    const { id } = req.params;

    const sql = `
      UPDATE tax_forms SET
        arpNo = ?, tdPrinted = ?, municipalCode = ?, accountNo = ?, ownerName = ?, ownerAddress = ?,
        administrator = ?, adminAddress = ?, north = ?, east = ?, south = ?, west = ?,
        propertyIndexNo = ?, subdivision = ?, phase = ?, lotNo = ?, tdPrintedNo = ?,
        houseNo = ?, street = ?, landmark = ?, barangay = ?, barangayOnPrint = ?, barangayText = ?,
        octNo = ?, dated = ?, surveyNo = ?, cadLotNo = ?, lotNo2 = ?, blockNo = ?, parcelId = ?
      WHERE id = ?
    `;

    const [result] = await database.query(sql, [
      data.arpNo,
      data.tdPrinted,
      data.municipalCode,
      data.accountNo,
      data.ownerName,
      data.ownerAddress,
      data.administrator,
      data.adminAddress,
      data.north,
      data.east,
      data.south,
      data.west,
      data.propertyIndexNo,
      data.subdivision,
      data.phase,
      data.lotNo,
      data.tdPrintedNo,
      data.houseNo,
      data.street,
      data.landmark,
      data.barangay,
      data.barangayOnPrint,
      data.barangayText,
      data.octNo,
      formatDate(data.dated) || null,
      data.surveyNo,
      data.cadLotNo,
      data.lotNo2,
      data.blockNo,
      data.parcelId || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.status(200).json({ message: "Tax updated successfully" });
  } catch (err) {
    console.error("editById error:", err);
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/tax/lookup?parcelId=... | ?lotNo=...&barangay=... */
export async function lookup(req, res) {
  try {
    const { parcelId, lotNo, barangay } = req.query;

    if (!parcelId && !lotNo) {
      return res.status(400).json({ error: "parcelId or lotNo is required" });
    }

    let sql = "";
    let params = [];
    if (parcelId) {
      sql = "SELECT id FROM tax_forms WHERE parcelId = ? LIMIT 1";
      params = [parcelId];
    } else {
      sql = "SELECT id FROM tax_forms WHERE lotNo = ?";
      params = [lotNo];
      if (barangay) {
        sql += " AND barangay = ?";
        params.push(barangay);
      }
      sql += " LIMIT 1";
    }

    const [rows] = await database.query(sql, params);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error("lookup error:", err);
    res.status(500).json({ error: err.message });
  }
}
export async function removeById(req, res) {
  try {
    const { id } = req.params;
    const [result] = await database.query("DELETE FROM tax_forms WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}