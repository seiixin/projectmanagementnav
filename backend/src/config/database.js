import mysql2 from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const database = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}).promise() 


export { database };