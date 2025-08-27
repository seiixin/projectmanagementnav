// backend/src/lib/audit.js
import { database } from "../config/database.js";

export async function writeAuditLog({
  req,
  user_id = null,
  username = "unknown",
  action,                 // 'CREATE' | 'UPDATE' | 'DELETE'
  entity_type,            // 'ibaan' | 'tax_forms' | 'landparcel' | ...
  entity_id,              // string/number
  entity_ctx = null,      // small JSON: { ParcelId, LotNumber, BarangayNa, ... }
  changed_fields = null,  // array or null
  before_data = null,     // small snapshot or null
  after_data = null,      // small snapshot or null
}) {
  const ip =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    null;

  const user_agent = req?.headers?.["user-agent"] || null;

  const sql = `
    INSERT INTO audit_logs
      (user_id, username, action, entity_type, entity_id, entity_ctx,
       changed_fields, before_data, after_data, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const toJson = (x) => (x == null ? null : JSON.stringify(x));

  await database.query(sql, [
    user_id,
    username,
    action,
    entity_type,
    String(entity_id ?? ""),
    toJson(entity_ctx),
    toJson(changed_fields),
    toJson(before_data),
    toJson(after_data),
    ip,
    user_agent,
  ]);
}

/** Shallow diff helper */
export function diffFields(before = {}, after = {}) {
  const changed = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const k of keys) {
    const b = before?.[k];
    const a = after?.[k];
    // Skip volatile/huge fields if you want
    if (k === "geometry") continue;
    if (JSON.stringify(b) !== JSON.stringify(a)) changed.push(k);
  }
  return changed;
}
