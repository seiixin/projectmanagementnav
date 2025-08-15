import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors'
import { database } from './config/database.js';
import alamedaRoutes from './routes/alamedaRoute.js'
import ibaanRoutes from './routes/ibaanRoute.js'
import landParcelRoutes from './routes/landParcelRoute.js'
import userRoutes from './routes/userRoute.js'

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use(express.json())
    app.use(cors({
        origin:"http://localhost:5173"
    }))

//Check Database Connection
const [rows] = await database.query('SELECT 1 + 1 AS result');
console.log('✅ Connected to Database successfully!');

//API
app.use("/api/alameda", alamedaRoutes);
app.use("/api/ibaan", ibaanRoutes);
app.use("/api/landparcel", landParcelRoutes);
app.use("/api/user", userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});