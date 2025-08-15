import { database } from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'

dotenv.config();

export async function signup(req, res) {
  try {
    const { username, first_name, last_name, email, password } = req.body;
    let role = 2;
    const checkSql = `SELECT * FROM users WHERE username = ? OR email = ? `;
    const [existing] = await database.execute(checkSql, [username, email]);

    if (existing.length > 0) {
      return res.status(400).json({result: 0,
        error: existing[0].username === username
          ? "Username already exists"
          : "Email already exists"
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, first_name, last_name, email, password,role) VALUES (?, ?, ?, ?, ?, ?)';
    await database.execute(sql, [username, first_name, last_name, email, hash, role]);
    return res.status(200).json({result: 1, message: 'User registered successfully' });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [results] =await database.query(sql, [username]);
    if (results.length === 0) return res.status(401).json({result: 0, error: 'User not found' });
    
    const user = results[0];
    let match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ result: 0, error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ result: 1, message: 'Login successful', token });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: err.message });
  }
}
