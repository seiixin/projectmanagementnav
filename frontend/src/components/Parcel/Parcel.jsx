import React, { useState, useEffect } from "react";
import api from "../../lib/axios.js";
import {  useNavigate } from "react-router";

const Parcel = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState([]);
  const [parcel, setParcel] = useState(null);

  const handleSearch = async () => {
    console.log(`Searching for: ${searchTerm} in ${location}`);
    let res = "";
    if (location === "ibaan") {
       res = await api.get("/ibaan/search/"+ searchTerm);
    } else {
      res = await api.get("/alameda/search/"+ searchTerm);
    }
    setResults([res.data]);
    const dataArray = Array.isArray(res.data) ? res.data : [res.data];

      setResults(dataArray);
      localStorage.setItem("results", JSON.stringify(dataArray));
      const savedResults = JSON.parse(localStorage.getItem("results") || "[]");
  };

  useEffect(() => {
    localStorage.removeItem("ParcelId");
    const searchTerm = localStorage.getItem("searchTerm");
    const location = localStorage.getItem("location");
    const results = localStorage.getItem("results");
    setSearchTerm(searchTerm);
    setLocation(location);
    //setResults(results);

    
    console.log(results)
  },[]);

  const handleEdit = (parcel) => {
    let ParcelId = parcel.ParcelId;
    localStorage.setItem("ParcelId", ParcelId);
    localStorage.setItem("searchTerm", searchTerm);
    localStorage.setItem("location", location);
    if (location === "ibaan") {
      navigate("/ibaan");
    } else {
      navigate("/alameda");
    }
  };

  const handleAdd = () => {
    if (location === "ibaan") {
      navigate("/ibaan");
    } else {
      navigate("/alameda");
    }
  };

  return (
    <div className="container mt-4">
      <h4>Search Parcels</h4>

      {/* Location Dropdown */}
      <div className="row mb-3">
        <div className="col-md-4">
          <select
            className="form-select"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Select Location</option>
            <option value="ibaan">Ibaan</option>
            <option value="alemada">Alemada</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by owner, Parcel ID, or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div><br/><br/>
        <div className="col-md-auto">
          <button className="btn btn-primary" onClick={handleSearch}>
            Search
          </button> &nbsp;
          <button className="btn btn-primary" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 ? (
        <table className="table table-striped table-bordered table-hover table-responsive">
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Owner</th>
              <th>Barangay</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((parcel, index) => (
              <tr key={index}>
                <td>{parcel.ParcelId}</td>
                <td>{parcel.Claimant}</td>
                <td>{parcel.BarangayNa}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEdit(parcel)}
                  >
                    Edit
                  </button>
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

export default Parcel;