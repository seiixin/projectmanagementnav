// frontend/src/components/LandParcelList/LandParcelList.jsx
import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from "../../lib/axios.js";
import { useNavigate } from "react-router-dom";

const LandParcelList = () => {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [navBusyId, setNavBusyId] = useState(null);

  const toStr = (v) => (v == null ? "" : String(v).trim());

  useEffect(() => {
    const fetchLandParcel = async () => {
      try {
        const res = await api.get("/landparcel");
        setParcels(Array.isArray(res.data) ? res.data : []);
        localStorage.removeItem("parcelID");
      } catch (error) {
        console.error("error fetching data", error);
        setParcels([]);
      }
    };
    fetchLandParcel();
  }, []);

  const handleEdit = (parcel) => {
    localStorage.setItem("parcelID", parcel.parcelID);
    navigate("/landparcel");
  };

  const handleAdd = () => navigate("/landparcel");

  // ✅ Same behavior as TaxList "View on Map"
  const handleViewOnMap = (parcel) => {
    // Be generous about field names
    const pid = toStr(
      parcel.parcelID ?? parcel.ParcelId ?? parcel.parcelId ?? parcel.PARCELID ?? ""
    );

    if (!pid) {
      alert("This row has no Parcel ID.");
      return;
    }

    // Optional heads-up (matches your earlier UX)
    alert(`Redirecting to: ${pid}`);

    // Disable just this row's button briefly
    setNavBusyId(parcel.parcelID ?? pid);

    // Deep link: MapPage will focus & open popup
    navigate(`/${encodeURIComponent(pid)}`);
  };

  // (still a placeholder)
  const handleDelete = async (parcel) => {
    alert(`Delete (TEMP): Would delete parcelID=${parcel.parcelID}`);
  };

  return (
    <div className="container mt-4">
      <h2>Land Parcel List</h2>
      <Button className="mb-3" onClick={handleAdd}>
        Add New
      </Button>

      {parcels.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Street Address</th>
              <th>Barangay</th>
              <th>Municipality</th>
              <th>Zip Code</th>
              <th style={{ minWidth: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => {
              const rowPid = parcel.parcelID ?? parcel.ParcelId ?? parcel.parcelId;
              const busy = navBusyId === rowPid;
              return (
                <tr key={parcel.parcelID}>
                  <td>{parcel.parcelID}</td>
                  <td>{parcel.StreetAddress}</td>
                  <td>{parcel.Barangay}</td>
                  <td>{parcel.Municipality}</td>
                  <td>{parcel.ZipCode}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewOnMap(parcel)}
                        disabled={busy}
                      >
                        {busy ? "Opening…" : "View on Map"}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(parcel)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(parcel)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No results found.</p>
      )}
    </div>
  );
};

export default LandParcelList;
