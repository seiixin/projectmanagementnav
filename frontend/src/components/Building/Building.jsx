import React, { useState, useEffect } from "react";
import {  useNavigate } from "react-router-dom";
import api from '../../lib/axios.js';
import "bootstrap/dist/css/bootstrap.min.css";

const Building = () => {
    const navigate = useNavigate();
  const [form, setForm] = useState({
    building_num: "",
    buildingName: "",
    buildingUseType: "",
    buildingType: "",
    area: "",
  });

  useEffect(() => {
    const fetchBuilding = async () => {
      try {             
        const buildingNum = localStorage.getItem("buildingNum");
        if(buildingNum !== null) {
            const res = await api.get("/building/" + buildingNum);
            setForm(res.data);
        }
     } catch (error) {
        console.log(error)
        console.log("error fetching data")
      } 
    }
    fetchBuilding();
  },[]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        let buildingNum = localStorage.getItem("buildingNum");
        if (buildingNum) {
            await api.put(`/building/${buildingNum}`, form);
            alert("Building updated successfully!");
            localStorage.removeItem("buildingNum");
        } else {
            await api.post("/building", form);
            alert("Building saved successfully!");
        }
        navigate("/buildinglist");
      
    } catch (err) {
      console.error(err);
      
    }
  };

  return (
    <div className="container mt-4">
      <h3>Building Form</h3>
      <form className="row g-3" onSubmit={handleSubmit}>
        
        {/* Building Number */}
        <div className="col-md-6">
          <label className="form-label">Building Number</label>
          <input
            type="text"
            className="form-control"
            name="buildingName"
            value={form.building_num}
            onChange={handleChange}
            disabled
          />
        </div>

        {/* Building Name */}
        <div className="col-md-6">
          <label className="form-label">Building Name</label>
          <input
            type="text"
            className="form-control"
            name="buildingName"
            value={form.buildingName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Building Use Type */}
        <div className="col-md-6">
          <label className="form-label">Building Use Type</label>
          <select
            className="form-select"
            name="buildingUseType"
            value={form.buildingUseType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Use Type --</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Common Property">Common Property</option>
            <option value="Parking Space">Parking Space</option>
          </select>
        </div>

        {/* Building Type */}
        <div className="col-md-6">
          <label className="form-label">Building Type</label>
          <select
            className="form-select"
            name="buildingType"
            value={form.buildingType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Type --</option>
            <option value="Condominium">Condominium</option>
            <option value="Apartment">Apartment</option>
            <option value="Single-detached">Single-detached</option>
            <option value="Town House">Town House</option>
            <option value="Bungalow">Bungalow</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Parking Space">Parking Space</option>
          </select>
        </div>

        {/* Area */}
        <div className="col-md-6">
          <label className="form-label">Area</label>
          <input
            type="text"
            className="form-control"
            name="area"
            value={form.area}
            onChange={handleChange}
            placeholder="e.g., 250 sqm"
          />
        </div>

        {/* Submit */}
        <div className="col-12">
          <button className="btn btn-primary" type="submit">
            Save Building
          </button>
          
        </div>
      </form>
    </div>
  );
}

export default Building;