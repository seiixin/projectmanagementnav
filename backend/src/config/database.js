// backend/src/config/database.js
import mysql2 from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const database = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),

  // Prod-safe pool settings
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,

  // Safer serialization
  dateStrings: true,      // avoid TZ surprises
  supportBigNumbers: true,
  bigNumberStrings: true,
  // timezone: 'Z',       // uncomment if you want UTC always
}).promise();

export { database };
