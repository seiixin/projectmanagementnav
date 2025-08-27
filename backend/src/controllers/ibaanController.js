// backend/src/controllers/ibaanController.js
import { database } from '../config/database.js';
import { formatDate } from '../lib/utils.js';
import { writeAuditLog, diffFields } from '../lib/audit.js';

/** Columns allowed to be written */
const WRITABLE_FIELDS = [
  'ParcelId','SurveyId','BlockNumber','LotNumber','Area','Claimant','TiePointId','TiePointNa',
  'SurveyPlan','BarangayNa','Coordinate','XI','YI','LongitudeI','LatitudeI','LengthI','AreaI',
  'VersionI','tax_ID','Tax_Amount','Due_Date','AmountPaid','Date_paid','geometry'
];

const DATE_FIELDS = ['Due_Date','Date_paid'];

/** Normalize body → only allowed columns, with date/geometry handling */
function pickWritable(body = {}) {
  const out = {};
  for (const k of WRITABLE_FIELDS) {
    if (body[k] === undefined) continue;

    let v = body[k];

    // dates
    if (DATE_FIELDS.includes(k)) {
      v = formatDate(v) || null;
    }

    // geometry: accept stringified or object
    if (k === 'geometry') {
      if (v && typeof v === 'string') {
        try { v = JSON.parse(v); } catch { /* keep original string */ }
      }
      // mysql2 will happily take a JS object for JSON column
    }

    out[k] = v;
  }
  return out;
}

/** Small snapshot (omit geometry) for audit logs */
function slim(row = {}) {
  if (!row) return null;
  const {
    ParcelId, SurveyId, BlockNumber, LotNumber, Area, Claimant, TiePointId, TiePointNa,
    SurveyPlan, BarangayNa, Coordinate, XI, YI, LongitudeI, LatitudeI, LengthI, AreaI,
    VersionI, tax_ID, Tax_Amount, Due_Date, AmountPaid, Date_paid
  } = row;
  return {
    ParcelId, SurveyId, BlockNumber, LotNumber, Area, Claimant, TiePointId, TiePointNa,
    SurveyPlan, BarangayNa, Coordinate, XI, YI, LongitudeI, LatitudeI, LengthI, AreaI,
    VersionI, tax_ID, Tax_Amount, Due_Date, AmountPaid, Date_paid
  };
}

/* ===================== READ ===================== */

export async function getAll(req, res) {
  try {
    const [rows] = await database.execute('SELECT * FROM ibaan');
    res.json(rows);
  } catch (err) {
    console.error('getAll error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params; // ParcelId
    const [rows] = await database.execute('SELECT * FROM ibaan WHERE ParcelId = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Data not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getById error:', err);
    res.status(500).json({ error: err.message });
  }
}

/* ===================== CREATE ===================== */

export async function addNew(req, res) {
  try {
    const data = pickWritable(req.body);

    if (!data.ParcelId) {
      return res.status(400).json({ error: 'ParcelId is required' });
    }

    // Build dynamic insert
    const cols = Object.keys(data);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((k) => data[k]);
    const sql = `INSERT INTO ibaan (${cols.join(', ')}) VALUES (${placeholders})`;

    await database.execute(sql, values);

    // Reload inserted row
    const [rows] = await database.execute('SELECT * FROM ibaan WHERE ParcelId = ?', [data.ParcelId]);
    const created = rows[0] || data;

    // Audit
    const afterSlim = slim(created);
    await writeAuditLog({
      req,
      action: 'CREATE',
      entity_type: 'ibaan',
      entity_id: String(data.ParcelId),
      entity_ctx: {
        ParcelId: data.ParcelId,
        LotNumber: created?.LotNumber,
        BarangayNa: created?.BarangayNa
      },
      changed_fields: Object.keys(afterSlim || {}),
      before_data: null,
      after_data: afterSlim
    });

    res.status(201).json({ message: 'Parcel created', data: created });
  } catch (err) {
    console.error('addNew error:', err);
    res.status(500).json({ error: err.message });
  }
}

/* ===================== UPDATE ===================== */

export async function editById(req, res) {
  try {
    const { id } = req.params;          // ParcelId
    const patch = pickWritable(req.body);

    // Snapshot BEFORE
    const [beforeRows] = await database.execute('SELECT * FROM ibaan WHERE ParcelId = ?', [id]);
    if (!beforeRows.length) return res.status(404).json({ error: 'Data not found' });
    const before = beforeRows[0];

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    // Dynamic SET list
    const sets = Object.keys(patch).map((k) => `${k} = ?`).join(', ');
    const values = Object.keys(patch).map((k) => patch[k]);

    const sql = `UPDATE ibaan SET ${sets} WHERE ParcelId = ?`;
    const [result] = await database.execute(sql, [...values, id]);
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Not found or no changes' });
    }

    // Snapshot AFTER
    const [afterRows] = await database.execute('SELECT * FROM ibaan WHERE ParcelId = ?', [id]);
    const after = afterRows[0];

    const beforeSlim = slim(before);
    const afterSlim  = slim(after);
    const changed = diffFields(beforeSlim, afterSlim);

    await writeAuditLog({
      req,
      action: 'UPDATE',
      entity_type: 'ibaan',
      entity_id: String(id),
      entity_ctx: {
        ParcelId: id,
        LotNumber: after?.LotNumber,
        BarangayNa: after?.BarangayNa
      },
      changed_fields: changed,
      before_data: beforeSlim,
      after_data: afterSlim
    });

    res.json({ message: 'Parcel updated successfully', data: after });
  } catch (err) {
    console.error('editById error:', err);
    res.status(500).json({ error: err.message });
  }
}

/* ===================== DELETE ===================== */

export async function removeById(req, res) {
  try {
    const { id } = req.params; // ParcelId

    const [rows] = await database.execute('SELECT * FROM ibaan WHERE ParcelId = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Data not found' });
    const before = rows[0];
    const beforeSlim = slim(before);

    const [result] = await database.execute('DELETE FROM ibaan WHERE ParcelId = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });

    await writeAuditLog({
      req,
      action: 'DELETE',
      entity_type: 'ibaan',
      entity_id: String(id),
      entity_ctx: { ParcelId: id, LotNumber: before?.LotNumber, BarangayNa: before?.BarangayNa },
      changed_fields: [],
      before_data: beforeSlim,
      after_data: null
    });

    res.json({ message: 'Parcel deleted' });
  } catch (err) {
    console.error('removeById error:', err);
    res.status(500).json({ error: err.message });
  }
}

/* ===================== SEARCH ===================== */

export async function search(req, res) {
  try {
    const raw = String(req.params.value ?? '').trim();
    if (!raw) return res.json([]);

    // %LIKE% for ParcelId / Claimant / BarangayNa
    const needle = `%${raw}%`;

    const [rows] = await database.execute(
      `SELECT * FROM ibaan
       WHERE CAST(ParcelId AS CHAR) LIKE ?
          OR Claimant LIKE ?
          OR BarangayNa LIKE ?`,
      [needle, needle, needle]
    );

    if (!rows.length) return res.json([]);
    res.json(rows);
  } catch (err) {
    console.error('search error:', err);
    res.status(500).json({ error: err.message });
  }
}
