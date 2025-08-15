import { database } from '../config/database.js';

export async function getAll (req, res) {
  try {
    const [data] = await database.query('SELECT * FROM landparcel');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addNew (req, res) {
  try {
const {
    improvement,
    totalValue,
    StreetAddress,
    Barangay,
    Municipality,
    ZipCode,
    areaSize,
    propertyType,
    actualLandUse
  } = req.body;

  const sql = `INSERT INTO LandParcel (improvement, totalValue, StreetAddress, Barangay, Municipality, ZipCode, areaSize, propertyType, actualLandUse)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  database.query(sql,[improvement, totalValue, StreetAddress, Barangay, Municipality, ZipCode, areaSize, propertyType, actualLandUse],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ error: 'Database insert failed' });
      }
      res.json({ message: 'LandParcel added successfully', parcelID: result.insertId });
    }
  );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getById (req, res) {
  try {
    const [data] = await database.execute('SELECT * FROM landparcel WHERE parcelid = ?', [req.params.id]);
    if (data.length === 0) {
      return res.status(404).json({ error: "Data not found" });
    }
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function editById (req, res) {
  try {
    const data = req.body;
    const { id } = req.params;
    const {
        improvement,
        totalValue,
        StreetAddress,
        Barangay,
        Municipality,
        ZipCode,
        areaSize,
        propertyType,
        actualLandUse
    } = req.body;

    const sql = `
        UPDATE LandParcel 
        SET 
        improvement = ?, 
        totalValue = ?, 
        StreetAddress = ?, 
        Barangay = ?, 
        Municipality = ?, 
        ZipCode = ?, 
        areaSize = ?, 
        propertyType = ?, 
        actualLandUse = ?
        WHERE parcelID = ?`;

    database.query(sql, [
      improvement,
      totalValue,
      StreetAddress,
      Barangay,
      Municipality,
      ZipCode,
      areaSize,
      propertyType,
      actualLandUse,
      id
    ], (err, result) => {
      if (err) {
        console.error(err);
        console.log(err)
        res.status(500).json({ error: "Database update failed" });
      } else {
        res.status(200).json({ message: "Parcel updated successfully" });
      }
    });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}