import { database } from '../config/database.js';

export async function addNew(req, res) {
  const data = req.body;
  try {
    const sql = `INSERT INTO building (buildingName, buildingUseType, buildingType, area)
                  VALUES (?, ?, ?, ?)`;

    database.query(sql,[data.buildingName, data.buildingUseType, data.buildingType, data.area],
      (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).json({ error: 'Database insert failed' });
        }
        res.json({ message: 'Building added successfully'});
      }
    );
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const [data] = await database.query('SELECT * FROM building');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getById(req, res) {
  try {
    const [data] = await database.execute('SELECT * FROM building WHERE building_num = ?', [req.params.id]);
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

    const sql = `
        UPDATE building 
        SET 
        buildingName = ?, 
        buildingUseType = ?, 
        buildingType = ?, 
        area = ?
        WHERE building_num = ?`;

    database.query(sql, [
      data.buildingName,
      data.buildingUseType,
      data.buildingType,
      data.area,
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
