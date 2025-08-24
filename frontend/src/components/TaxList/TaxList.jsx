import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from "../../lib/axios.js";
import { useNavigate } from "react-router-dom";

const TaxList = () => {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState([]);

  // fetch taxes
  const fetchTaxes = async () => {
    try {
      const res = await api.get("/tax");
      setTaxes(res.data);
      localStorage.removeItem("taxId"); // leave edit mode
    } catch (error) {
      console.log("error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleEdit = (tax) => {
    localStorage.setItem("taxId", tax.id);
    navigate("/taxform");
  };

  const handleAdd = () => navigate("/taxform");

  const handleViewOnMap = (tax) => {
    const payload = {
      parcelId: tax.parcelId || tax.ParcelId || "",
      lotNo: tax.lotNo || tax.lotNo2 || tax.LotNumber || "",
      barangay: tax.barangay || tax.BarangayNa || "",
      label: tax.arpNo || tax.lotNo || tax.lotNo2 || "Selected Lot",
    };
    localStorage.removeItem("taxId");
    localStorage.setItem("mapFocus", JSON.stringify(payload));
    navigate("/"); // adjust if map page has diff route
  };

  // 🆕 delete tax
  const handleDelete = async (tax) => {
    if (!window.confirm(`Delete tax form for ${tax.ownerName}?`)) return;
    try {
      await api.delete(`/tax/${tax.id}`);
      alert("Tax form deleted successfully.");
      fetchTaxes(); // refresh list
    } catch (error) {
      console.error("delete failed", error);
      alert("Failed to delete tax form.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Taxes List</h2>
      <Button variant="primary" onClick={handleAdd} className="mb-3">
        Add New
      </Button>

      {taxes.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ARP/TD No.</th>
              <th>Account No.</th>
              <th>Owner’s Name</th>
              <th style={{ width: 300 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax) => (
              <tr key={tax.id}>
                <td>{tax.arpNo}</td>
                <td>{tax.accountNo}</td>
                <td>{tax.ownerName}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewOnMap(tax)}
                    >
                      View on Map
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEdit(tax)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(tax)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No results found.</p>
      )}
    </div>
  );
};

export default TaxList;
