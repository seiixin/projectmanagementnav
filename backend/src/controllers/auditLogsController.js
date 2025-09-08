// backend/src/controllers/auditLogsController.js
import { database } from "../config/database.js";

const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 20;

const SORT_MAP = {
  created_at_desc: "created_at DESC",
  created_at_asc: "created_at ASC",
};

export async function getAuditLogs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page || PAGE_DEFAULT, 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || LIMIT_DEFAULT, 10), 1), 200);
    const offset = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const username = (req.query.username || "").trim();
    const entity_type = (req.query.entity_type || "").trim();
    const action = (req.query.action || "").trim(); // CREATE/UPDATE/DELETE
    const from = (req.query.from || "").trim();     // YYYY-MM-DD
    const to = (req.query.to || "").trim();         // YYYY-MM-DD
    const sortKey = (req.query.sort || "created_at_desc").trim();
    const orderBy = SORT_MAP[sortKey] || SORT_MAP.created_at_desc;

    const where = [];
    const params = [];

    if (username) {
      where.push(`username LIKE ?`);
      params.push(`%${username}%`);
    }

    if (entity_type) {
      where.push(`entity_type LIKE ?`);
      params.push(`%${entity_type}%`);
    }

    if (action) {
      where.push(`action = ?`);
      params.push(action);
    }

    if (from) {
      where.push(`created_at >= ?`);
      params.push(`${from} 00:00:00`);
    }

    if (to) {
      where.push(`created_at <= ?`);
      params.push(`${to} 23:59:59`);
    }

    if (q) {
      // Search username, entity_type, entity_id and a few JSON keys in entity_ctx
      where.push(`
        (
          username LIKE ?
          OR entity_type LIKE ?
          OR entity_id LIKE ?
          OR JSON_EXTRACT(entity_ctx, '$.ParcelId') LIKE ?
          OR JSON_EXTRACT(entity_ctx, '$.LotNumber') LIKE ?
          OR JSON_EXTRACT(entity_ctx, '$.BarangayNa') LIKE ?
          OR JSON_SEARCH(entity_ctx, 'one', ?) IS NOT NULL
        )
      `);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*) AS cnt FROM audit_logs ${whereSql}`;
    const [countRows] = await database.query(countSql, params);
    const total = countRows?.[0]?.cnt ?? 0;

    const dataSql = `
      SELECT
        id, user_id, username, action, entity_type, entity_id,
        entity_ctx, changed_fields, before_data, after_data,
        ip, user_agent, created_at
      FROM audit_logs
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const dataParams = params.slice();
    dataParams.push(limit, offset);

    const [rows] = await database.query(dataSql, dataParams);

    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error("getAuditLogs error:", err);
    res.status(500).json({ error: err.message });
  }
}
