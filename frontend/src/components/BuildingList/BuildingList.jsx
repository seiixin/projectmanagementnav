import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from "../../lib/axios.js";
import { useNavigate } from "react-router-dom";

const BuildingList = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await api.get("/building");
        setBuildings(res.data);
        localStorage.removeItem("buildingNum");
      } catch (error) {
        console.log("error fetching data:", error);
      }
    };
    fetchBuildings();
  }, []);

  const handleEdit = (building) => {
    localStorage.setItem("buildingNum", building.building_num);
    navigate("/building");
  };

  const handleAdd = () => {
    navigate("/building");
  };

  return (
    <div className="container mt-4">
      <h2>Building List</h2>
      <Button variant="primary" onClick={handleAdd} className="mb-3">
        Add New
      </Button>

      {buildings.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Building Number</th>
              <th>Building Name</th>
              <th>Building Use Type</th>
              <th>Building Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((building) => (
              <tr key={building.building_num}>
                <td>{building.building_num}</td>
                <td>{building.buildingName}</td>
                <td>{building.buildingUseType}</td>
                <td>{building.buildingType}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEdit(building)}
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

export default BuildingList;
