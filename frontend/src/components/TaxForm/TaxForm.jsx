// TaxForm.js
import React, { useState, useEffect } from "react";
import api from '../../lib/axios.js';
import { normalizeDate } from '../../lib/utils.js';
import {  useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TaxForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    arpNo: "",
    tdPrinted: false,
    municipalCode: false,
    accountNo: "",
    ownerName: "",
    ownerAddress: "",
    administrator: "",
    adminAddress: "",
    north: "",
    east: "",
    south: "",
    west: "",
    propertyIndexNo: "",
    subdivision: "",
    phase: "",
    lotNo: "",
    tdPrintedNo: "",
    houseNo: "",
    street: "",
    landmark: "",
    barangay: "",
    barangayOnPrint: false,
    barangayText: "",
    octNo: "",
    dated: "",
    surveyNo: "",
    cadLotNo: "",
    lotNo2: "",
    blockNo: "",
  });

  useEffect(() => {
    const fetchTax = async () => {
      try {             
        const taxId = localStorage.getItem("taxId");
        if(taxId !== null) {
            const res = await api.get("/tax/" + taxId);
          const taxData = { ...res.data };
          taxData.dated = normalizeDate(taxData.dated);
      
        setFormData(taxData);
        }
             } catch (error) {
        console.log(error)
        console.log("error fetching data")
      } 
    }
    fetchTax();
  },[]);

  // handle input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taxId = localStorage.getItem("taxId");
      if (taxId) {
        await api.put(`/tax/${taxId}`, formData);
        alert("Tax updated successfully!");
        localStorage.removeItem("parcelID");
      } else {
        await api.post("/tax", formData);
        alert("Tax saved successfully!");
      }
      navigate("/taxlist");
    } catch (error) {
      console.error(error);
      alert("Error saving data");
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Tax Form</h4>
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Left Column */}
          <div className="col-md-6">
            {/* Declared Owner */}
            <div className="card p-3 mb-3">
              <h5>Declared Owner</h5>
              <div className="row mb-2">
                <div className="col-md-6">
                  <label>ARP/TD No.</label>
                  <input type="text" className="form-control" name="arpNo" value={formData.arpNo} onChange={handleChange}/>
                </div>
                <div className="col-md-3">
                  <input type="checkbox" name="tdPrinted" checked={formData.tdPrinted} onChange={handleChange}/>
                  <label>TD Printed</label>
                </div>
                <div className="col-md-3">
                  <input type="checkbox" name="municipalCode" checked={formData.municipalCode} onChange={handleChange}/>
                  <label>Municipal Code</label>
                </div>
              </div>
              <div className="mb-2">
                <label>Account No.</label>
                <input type="text" className="form-control" name="accountNo" value={formData.accountNo} onChange={handleChange}/>
              </div>
              <div className="mb-2">
                <label>Owner’s Name</label>
                <input type="text" className="form-control" name="ownerName" value={formData.ownerName} onChange={handleChange}/>
              </div>
              <div className="mb-2">
                <label>Address</label>
                <input type="text" className="form-control" name="ownerAddress" value={formData.ownerAddress} onChange={handleChange}/>
              </div>
              <div className="mb-2">
                <label>Administrator</label>
                <input type="text" className="form-control" name="administrator" value={formData.administrator} onChange={handleChange}/>
              </div>
              <div className="mb-2">
                <label>Address</label>
                <input type="text" className="form-control" name="adminAddress" value={formData.adminAddress} onChange={handleChange}/>
              </div>
            </div>
            {/* Description */}
            <div className="card p-3 mb-3">
              <h5>Description and Other Particulars</h5>
              <div className="row mb-2">
                <div className="col-md-4">
                  <label>OCT/TCT No.</label>
                  <input type="text" className="form-control" name="octNo" value={formData.octNo} onChange={handleChange}/>
                </div>
                <div className="col-md-4">
                  <label>Dated</label>
                  <input type="date" className="form-control" name="dated" value={formData.dated || ""} onChange={handleChange}/>
                </div>
                <div className="col-md-4">
                  <label>Survey No.</label>
                  <input type="text" className="form-control" name="surveyNo" value={formData.surveyNo} onChange={handleChange}/>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-4">
                  <label>Cad Lot No.</label>
                  <input type="text" className="form-control" name="cadLotNo" value={formData.cadLotNo} onChange={handleChange}/>
                </div>
                <div className="col-md-4">
                  <label>Lot No.</label>
                  <input type="text" className="form-control" name="lotNo2" value={formData.lotNo2} onChange={handleChange}/>
                </div>
                <div className="col-md-4">
                  <label>Block No.</label>
                  <input type="text" className="form-control" name="blockNo" value={formData.blockNo} onChange={handleChange}/>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Column */}
          <div className="col-md-6">
            {/* Location of Property */}
            <div className="card p-3 mb-3">
              <h5>Location of Property</h5>
              <label>Property Index No.</label>
              <input type="text" className="form-control mb-2" name="propertyIndexNo" value={formData.propertyIndexNo} onChange={handleChange}/>
              <label>Subdivision</label>
              <input type="text" className="form-control mb-2" name="subdivision" value={formData.subdivision} onChange={handleChange}/>
              <div className="row mb-2">
                <div className="col-md-3">
                  <label>Phase</label>
                  <input type="text" className="form-control" name="phase" value={formData.phase} onChange={handleChange}/>
                </div>
                <div className="col-md-3">
                  <label>Lot #</label>
                  <input type="text" className="form-control" name="lotNo" value={formData.lotNo} onChange={handleChange}/>
                </div>
                <div className="col-md-3">
                  <label>TD Printed #</label>
                  <input type="text" className="form-control" name="tdPrintedNo" value={formData.tdPrintedNo} onChange={handleChange}/>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-6">
                  <label>House No.</label>
                  <input type="text" className="form-control" name="houseNo" value={formData.houseNo} onChange={handleChange}/>
                </div>
                <div className="col-md-6">
                  <label>Street</label>
                  <input type="text" className="form-control" name="street" value={formData.street} onChange={handleChange}/>
                </div>
              </div>
              <label>Cor./Landmark</label>
              <input type="text" className="form-control mb-2" name="landmark" value={formData.landmark} onChange={handleChange}/>
              <label>Barangay</label>
              <input type="text" className="form-control mb-2" name="barangay" value={formData.barangay} onChange={handleChange}/>
              <div className="d-flex align-items-center mb-2">
                <input type="checkbox" name="barangayOnPrint" checked={formData.barangayOnPrint} onChange={handleChange}/>
                <label className="ms-2">Barangay appeared on TD Print-out</label>
                <input type="text" className="form-control ms-2" name="barangayText" value={formData.barangayText} onChange={handleChange}/>
              </div>
            </div>
            {/* Boundaries */}
            <div className="card p-3 mb-3">
              <h5>Boundaries</h5>
              <div className="row mb-2">
                <div className="col-md-6">
                  <label>North</label>
                  <input type="text" className="form-control" name="north" value={formData.north} onChange={handleChange}/>
                </div>
                <div className="col-md-6">
                  <label>East</label>
                  <input type="text" className="form-control" name="east" value={formData.east} onChange={handleChange}/>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-6">
                  <label>South</label>
                  <input type="text" className="form-control" name="south" value={formData.south} onChange={handleChange}/>
                </div>
                <div className="col-md-6">
                  <label>West</label>
                  <input type="text" className="form-control" name="west" value={formData.west} onChange={handleChange}/>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Submit */}
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Save Tax
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxForm;
