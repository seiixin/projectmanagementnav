import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from "../../lib/axios.js";
import { useNavigate } from "react-router-dom";

const TaxList = () => {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const res = await api.get("/tax");
        setTaxes(res.data);
        localStorage.removeItem("taxId");
      } catch (error) {
        console.log("error fetching data:", error);
      }
    };
    fetchTaxes();
  }, []);

  const handleEdit = (tax) => {
    localStorage.setItem("taxId", tax.id);
    navigate("/taxform");
  };

  const handleAdd = () => {
    navigate("/taxform");
  };

  return (
    <div className="container mt-4">
      <h2>Tax List</h2>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax) => (
              <tr key={tax.id}>
                <td>{tax.arpNo}</td>
                <td>{tax.accountNo}</td>
                <td>{tax.ownerName}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEdit(tax)}
                  >
                    Edit
                  </Button>
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
