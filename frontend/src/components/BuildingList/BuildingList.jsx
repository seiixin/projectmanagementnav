// LandParcelList.js
import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from '../../lib/axios.js';
import {  useNavigate } from "react-router-dom";

const BuildingList = () => {
    const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    const fetchLandParcel = async () => {
        try {             
            const res = await api.get("/building");
            setBuildings(res.data);
            localStorage.removeItem("buildingNum");
        } catch (error) {
            console.log(error)
            console.log("error fetching data")
        } 
    }
    fetchLandParcel();
  }, []);

  const handleEdit = (building) => {
    let buildingNum = building.building_num;
    localStorage.setItem("buildingNum", buildingNum);
    navigate("/building");
  };

  const handleAdd = () => {
      navigate("/building");
  };

  return (
    <div className="container mt-4">
      <h2>Building List</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
            Add New
        </button><br/><br/>
      {buildings.length > 0 ? (
      <table className="table table-striped table-bordered table-hover table-responsive">
        <thead>
          <tr>
            <th>Building Number</th>
            <th>Building Name</th>
            <th>Building Use Type</th>
            <th>Building Type</th>
            <th>Actions</th> {/* New column for buttons */}
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
      </table>
      ) : (
        <p className="text-muted">No results found.</p>
      )}
    </div>
  );
}

export default BuildingList;