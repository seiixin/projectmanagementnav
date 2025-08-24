import React, { useState, useEffect } from "react";
import api from '../../lib/axios.js';
import { normalizeDate } from '../../lib/utils.js';
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const TaxForm = () => {
  const navigate = useNavigate();

  const defaultFormData = {
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
    // optional foreign keys from map
    parcelId: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

  const [landAppraisal, setLandAppraisal] = useState([
    {
      id: "",
      class: "",
      subClass: "",
      actualUse: "",
      unitValue: "",
      area: "",
      baseMarketValue: "",
      stripping: "",
      adjustment: "",
      marketValue: "",
    },
  ]);

  const [landAssessment, setLandAssessment] = useState({
    id: "",
    propertyKind: "",
    propertyActualUse: "",
    adjustedMarketValue: "",
    level: "",
    assessedValue: "",
    taxability: "",
    year: "",
    quarter: "",
    updateCode: "",
    dateRegistered: ""
  });

  const [otherDetails, setOtherDetails] = useState({
    id: "",
    taxability: "",
    effectivityYear: "",
    quarter: "",
    updateCode: "",
    dateRegistered: ""
  });

  useEffect(() => {
    const fetchTax = async () => {
      try {
        const taxId = localStorage.getItem("taxId");

        if (taxId) {
          // ---- EDIT MODE ----
          const res = await api.get("/tax/" + taxId);
          const taxData = { ...res.data };
          taxData.dated = normalizeDate(taxData.dated);
          setFormData({ ...defaultFormData, ...taxData });

          const resLand = await api.get("/landappraisal/" + taxId);
          setLandAppraisal(resLand.data);

          const resLandAssess = await api.get("/landassessment/" + taxId);
          setLandAssessment(resLandAssess.data);

          const resOtherDetails = await api.get("/taxotherdetails/" + taxId);
          const otherDetailsData = { ...resOtherDetails.data };
          otherDetailsData.dateRegistered = normalizeDate(otherDetailsData.dateRegistered);
          setOtherDetails(otherDetailsData);
        } else {
          // ---- CREATE MODE with optional PREFILL ----
          const prefillStr = localStorage.getItem("prefillTaxData");
          if (prefillStr) {
            try {
              const prefill = JSON.parse(prefillStr);
              setFormData((prev) => ({
                ...prev,
                // map prefill keys to your form keys
                propertyIndexNo: prefill.propertyIndexNo ?? prev.propertyIndexNo,
                subdivision: prefill.subdivision ?? prev.subdivision,
                phase: prefill.phase ?? prev.phase,
                lotNo: prefill.lotNo ?? prev.lotNo,
                cadLotNo: prefill.cadLotNo ?? prev.cadLotNo,
                barangay: prefill.barangay ?? prev.barangay,
                parcelId: prefill.parcelId ?? prev.parcelId,
              }));
            } catch {}
            localStorage.removeItem("prefillTaxData");
          }
        }
      } catch (error) {
        console.log(error);
        console.log("error fetching data");
      }
    };
    fetchTax();
  }, []);

  // handle input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let taxId = localStorage.getItem("taxId");
      if (taxId) {
        await api.put(`/tax/${taxId}`, formData);
        alert("Tax updated successfully!");
        localStorage.removeItem("parcelID");
      } else {
        const result = await api.post("/tax", formData);
        taxId = result.data.insertId;
        alert("Tax saved successfully!");
      }
      await api.post(`/landappraisal/${taxId}`, landAppraisal);
      await api.post(`/landassessment/${taxId}`, landAssessment);
      await api.post(`/taxotherdetails/${taxId}`, otherDetails);
      navigate("/taxlist");
    } catch (error) {
      console.error(error);
      alert("Error saving data");
    }
  };

  const handleChangeLand = (index, e) => {
    const { name, value } = e.target;
    const updated = [...landAppraisal];
    updated[index][name] = value;
    setLandAppraisal(updated);
  };

  const handleChangeLandAssessment = (e) => {
    const { name, value } = e.target;
    setLandAssessment((s) => ({ ...s, [name]: value }));
  };

  const handleChangeOtherDetails = (e) => {
    const { name, value } = e.target;
    setOtherDetails((s) => ({ ...s, [name]: value }));
  };

  const addRow = () => {
    setLandAppraisal((rows) => [
      ...rows,
      {
        id: "",
        class: "",
        subClass: "",
        actualUse: "",
        unitValue: "",
        area: "",
        baseMarketValue: "",
        stripping: "",
        adjustment: "",
        marketValue: "",
      },
    ]);
  };

  const deleteRow = async (index, row) => {
    if (row.id && row.taxid) {
      await api.delete(`/landappraisal/${row.taxid}/${row.id}`);
      alert("Row deleted successfully!");
    }
    setLandAppraisal((rows) => rows.filter((_, i) => i !== index));
  };

  const cancel = () => navigate("/taxlist");

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
                  <label> TD Printed</label>
                </div>
                <div className="col-md-3">
                  <input type="checkbox" name="municipalCode" checked={formData.municipalCode} onChange={handleChange}/>
                  <label> Municipal Code</label>
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

        {/* Land Appraisal */}
        <div className="col-12">
          <h4 className="mb-3">Land Appraisal Detail</h4>
          <div className="table-responsive">
            <table className="table table-bordered table-sm text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>Class</th>
                  <th>Sub-Class</th>
                  <th>Actual Use</th>
                  <th>Unit Value</th>
                  <th>Area</th>
                  <th>Base Market Value</th>
                  <th>Stripping</th>
                  <th>Adjustment</th>
                  <th>Market Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {landAppraisal.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input type="hidden" name="id" value={row.id || ""} />
                      <input type="text" name="class" className="form-control"
                        value={row.class || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="text" name="subClass" className="form-control"
                        value={row.subClass || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="text" name="actualUse" className="form-control"
                        value={row.actualUse || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="number" name="unitValue" className="form-control"
                        value={row.unitValue || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="number" name="area" className="form-control"
                        value={row.area || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="number" name="baseMarketValue" className="form-control"
                        value={row.baseMarketValue || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="number" name="stripping" className="form-control"
                        value={row.stripping || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="number" name="adjustment" className="form-control"
                        value={row.adjustment || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <input type="number" name="marketValue" className="form-control"
                        value={row.marketValue || ""} onChange={(e) => handleChangeLand(index, e)} />
                    </td>
                    <td>
                      <button type="button" className="btn btn-danger btn-sm"
                        onClick={() => deleteRow(index, row)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-primary" onClick={addRow}>
            Add Row
          </button>
        </div>

        {/* Land Assessment */}
        <div className="col-12 mt-4">
          <h4 className="mb-3">Land Assessment Summary</h4>
          <div className="table-responsive">
            <table className="table table-bordered table-sm text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>Property Kind</th>
                  <th>Actual Use</th>
                  <th>Adjusted Market Value</th>
                  <th>Level</th>
                  <th>Assessed Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input type="hidden" name="id" value={landAssessment.id || ""} />
                    <input type="text" name="propertyKind" className="form-control"
                      value={landAssessment.propertyKind} onChange={handleChangeLandAssessment} />
                  </td>
                  <td>
                    <input type="text" name="propertyActualUse" className="form-control"
                      value={landAssessment.propertyActualUse} onChange={handleChangeLandAssessment} />
                  </td>
                  <td>
                    <input type="number" name="adjustedMarketValue" className="form-control"
                      value={landAssessment.adjustedMarketValue} onChange={handleChangeLandAssessment} />
                  </td>
                  <td>
                    <input type="number" name="level" className="form-control"
                      value={landAssessment.level} onChange={handleChangeLandAssessment} />
                  </td>
                  <td>
                    <input type="number" name="assessedValue" className="form-control"
                      value={landAssessment.assessedValue} onChange={handleChangeLandAssessment} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Details */}
        <div className="col-12 mt-4">
          <h4 className="mb-3">Other Details</h4>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Taxability</label>
              <input type="hidden" name="id" value={otherDetails.id || ""} />
              <select name="taxability" className="form-select"
                value={otherDetails.taxability} onChange={handleChangeOtherDetails}>
                <option>-- Select --</option>
                <option value="Exempted">Exempted</option>
                <option value="Taxable">Taxable</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Effectivity Year</label>
              <input type="number" name="effectivityYear" className="form-control"
                value={otherDetails.effectivityYear} onChange={handleChangeOtherDetails} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Quarter</label>
              <select name="quarter" className="form-select"
                value={otherDetails.quarter} onChange={handleChangeOtherDetails}>
                <option>-- Select --</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Update Code</label>
              <select name="updateCode" className="form-select"
                value={otherDetails.updateCode} onChange={handleChangeOtherDetails}>
                <option>-- Select --</option>
                <option value="GENERAL REVISION">GENERAL REVISION</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Date Registered</label>
              <input type="date" name="dateRegistered" className="form-control"
                value={otherDetails.dateRegistered || ""} onChange={handleChangeOtherDetails} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="col-12 mt-4">
          <button type="submit" className="btn btn-primary">Save Tax</button>
          &nbsp;&nbsp;
          <button type="button" className="btn btn-primary" onClick={cancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default TaxForm;
