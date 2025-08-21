import { database } from '../config/database.js';
import { formatDate } from '../lib/utils.js';

export async function getAll(req, res) {
  try {
    const [data] = await database.query('SELECT * FROM tax_forms');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addNew(req, res) {
  const data = req.body;
  try {
    const sql = `INSERT INTO tax_forms (
      arpNo, tdPrinted, municipalCode, accountNo, ownerName, ownerAddress,
      administrator, adminAddress, north, east, south, west,
      propertyIndexNo, subdivision, phase, lotNo, tdPrintedNo,
      houseNo, street, landmark, barangay, barangayOnPrint, barangayText,
      octNo, dated, surveyNo, cadLotNo, lotNo2, blockNo
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    database.query(sql,[data.arpNo,
        data.tdPrinted,
        data.municipalCode,
        data.accountNo,
        data.ownerName,
        data.ownerAddress,
        data.administrator,
        data.adminAddress,
        data.north,
        data.east,
        data.south,
        data.west,
        data.propertyIndexNo,
        data.subdivision,
        data.phase,
        data.lotNo,
        data.tdPrintedNo,
        data.houseNo,
        data.street,
        data.landmark,
        data.barangay,
        data.barangayOnPrint,
        data.barangayText,
        data.octNo,
        formatDate(data.dated) || null,
        data.surveyNo,
        data.cadLotNo,
        data.lotNo2,
        data.blockNo],
      (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).json({ error: 'Database insert failed' });
        }
        res.json({ message: 'Tax added successfully'});
      }
    );
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getById(req, res) {
  try {
    const [data] = await database.execute('SELECT * FROM tax_forms WHERE id = ?', [req.params.id]);
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
        UPDATE tax_forms SET
      arpNo = ?, tdPrinted = ?, municipalCode = ?, accountNo = ?, ownerName = ?, ownerAddress = ?,
      administrator = ?, adminAddress = ?, north = ?, east = ?, south = ?, west = ?,
      propertyIndexNo = ?, subdivision = ?, phase = ?, lotNo = ?, tdPrintedNo = ?,
      houseNo = ?, street = ?, landmark = ?, barangay = ?, barangayOnPrint = ?, barangayText = ?,
      octNo = ?, dated = ?, surveyNo = ?, cadLotNo = ?, lotNo2 = ?, blockNo = ?
    WHERE id = ?`;

    database.query(sql, [
      data.arpNo,
    data.tdPrinted,
    data.municipalCode,
    data.accountNo,
    data.ownerName,
    data.ownerAddress,
    data.administrator,
    data.adminAddress,
    data.north,
    data.east,
    data.south,
    data.west,
    data.propertyIndexNo,
    data.subdivision,
    data.phase,
    data.lotNo,
    data.tdPrintedNo,
    data.houseNo,
    data.street,
    data.landmark,
    data.barangay,
    data.barangayOnPrint,
    data.barangayText,
    data.octNo,
    formatDate(data.dated),
    data.surveyNo,
    data.cadLotNo,
    data.lotNo2,
    data.blockNo,
    id // last param is WHERE id = ?
    ], (err, result) => {
      if (err) {
        console.error(err);
        console.log(err)
        res.status(500).json({ error: "Database update failed" });
      } else {
        res.status(200).json({ message: "Tax updated successfully" });
      }
    });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}   

