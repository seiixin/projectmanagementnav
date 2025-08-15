// LandParcelList.js
import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from '../../lib/axios.js';
import {  useNavigate } from "react-router";

const LandParcelList = () => {
    const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);

  useEffect(() => {
    const fetchLandParcel = async () => {
        try {             
            const res = await api.get("/landparcel");
            setParcels(res.data);
            
        } catch (error) {
            console.log(error)
            console.log("error fetching data")
        } 
    }
    fetchLandParcel();
  }, []);

  const handleEdit = (parcel) => {
    let parcelID = parcel.parcelID;
    localStorage.setItem("parcelID", parcelID);
    navigate("/landparcel");
  };

  return (
    <div className="container mt-4">
      <h2>Land Parcel List</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Parcel ID</th>

            <th>Street Address</th>
            <th>Barangay</th>
            <th>Municipality</th>
            <th>Zip Code</th>

            <th>Actions</th> {/* New column for buttons */}
          </tr>
        </thead>
        <tbody>
          {parcels.map((parcel) => (
            <tr key={parcel.parcelID}>
              <td>{parcel.parcelID}</td>
              <td>{parcel.StreetAddress}</td>
              <td>{parcel.Barangay}</td>
              <td>{parcel.Municipality}</td>
              <td>{parcel.ZipCode}</td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEdit(parcel)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default LandParcelList;