import { database } from '../config/database.js';

export async function getAll (req, res) {
  try {
    const [data] = await database.query('SELECT * FROM ibaan');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getById (req, res) {
  try {
    const [data] = await database.execute('SELECT * FROM ibaan WHERE parcelid = ?', [req.params.id]);
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
    const { id } = req.params;
    const data = req.body;

    const sql = `
      UPDATE ibaan SET
        SurveyId=?, BlockNumber=?, LotNumber=?, Area=?, Claimant=?, TiePointId=?, TiePointNa=?,
        SurveyPlan=?, BarangayNa=?, Coordinate=?, XI=?, YI=?, LongitudeI=?, LatitudeI=?, LengthI=?, AreaI=?, VersionI=?,
        tax_ID=?, Tax_Amount=?, Due_Date=?, AmountPaid=?, Date_paid=?
      WHERE ParcelId=?
    `;

    database.query(sql, [
      data.SurveyId, data.BlockNumber, data.LotNumber, data.Area,
      data.Claimant, data.TiePointId, data.TiePointNa, data.SurveyPlan, data.BarangayNa,
      data.Coordinate, data.XI, data.YI, data.LongitudeI, data.LatitudeI, data.LengthI,
      data.AreaI, data.VersionI, data.tax_ID, data.Tax_Amount, data.Due_Date,
      data.AmountPaid, data.Date_paid,
      id
    ], (err, result) => {
      if (err) {
        console.error(err);
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

export async function addNew(req, res) {
  try {
    const {
    ParcelId
  } = req.body

  const sql = `
    INSERT INTO ibaan (
      ParcelId
    ) VALUES (?)
  `;

  database.query(sql, [
    ParcelId
    ], (err, result) => {
      if (err) {
        console.error(err);
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

export async function search(req, res) {
  try {
    let value = req.params.value;
    const [data] = await database.execute('SELECT * FROM ibaan WHERE parcelid like (?) or claimant like (?) or barangayna like (?)', [value,value,value]);
    if (data.length === 0) {
      return res.status(404).json({ error: "Data not found" });
    }
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
