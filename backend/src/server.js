import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors'
import { database } from './config/database.js';
import alamedaRoutes from './routes/alamedaRoute.js'
import ibaanRoutes from './routes/ibaanRoute.js'
import landParcelRoutes from './routes/landParcelRoute.js'
import userRoutes from './routes/userRoute.js'
import buildingRoutes from './routes/buildingRoutes.js'
import taxRoutes from './routes/taxRoute.js'
import landAppraisalRoutes from './routes/landAppraisalRoute.js'
import landAssessmentRoutes from './routes/landAssessmentRoutes.js'
import taxOtherDetailsRoutes from './routes/taxOtherDetailsRoutes.js'

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
app.use("/api/building", buildingRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/landappraisal", landAppraisalRoutes);
app.use("/api/landassessment", landAssessmentRoutes);
app.use("/api/taxotherdetails", taxOtherDetailsRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});