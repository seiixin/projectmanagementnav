// frontend/src/components/TaxList/TaxList.jsx
import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import api from "../../lib/axios.js";
import { useNavigate } from "react-router-dom";

const toStr = (v) => (v == null ? "" : String(v).trim());
const up = (v) => toStr(v).toUpperCase();

export default function TaxList() {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState([]);
  const [navBusyId, setNavBusyId] = useState(null);

  // fetch taxes
  const fetchTaxes = async () => {
    try {
      const res = await api.get("/tax");
      setTaxes(Array.isArray(res.data) ? res.data : []);
      localStorage.removeItem("taxId"); // leave edit mode
    } catch (error) {
      console.log("error fetching data:", error);
      setTaxes([]);
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

  const handleViewOnMap = async (tax) => {
    setNavBusyId(tax.id);

    // Try to get ParcelId straight from the tax row
    let parcelId = toStr(tax.parcelId ?? tax.ParcelId ?? tax.parcelID ?? "");

    const lot = up(tax.lotNo ?? tax.lotNo2 ?? tax.LotNumber ?? "");
    const brgy = up(tax.barangay ?? tax.BarangayNa ?? "");

    // If missing ParcelId, try to infer from /ibaan using LotNumber + Barangay
    if (!parcelId && (lot || brgy)) {
      try {
        const res = await api.get("/ibaan");
        const rows = Array.isArray(res.data) ? res.data : [res.data];
        const match = rows.find((r) => {
          const rLot = up(r?.LotNumber ?? r?.lotNo ?? "");
          const rBrgy = up(r?.BarangayNa ?? r?.barangay ?? "");
          return (lot ? rLot === lot : true) && (brgy ? rBrgy === brgy : true);
        });
        if (match) {
          parcelId = toStr(
            match?.ParcelId ?? match?.parcelId ?? match?.PARCELID ?? match?.parcelID ?? ""
          );
        }
      } catch (e) {
        console.warn("ParcelId lookup via /ibaan failed:", e);
      }
    }

    // If we have a ParcelId → deep-link and MapPage will auto-open the popup
    if (parcelId) {
      alert(`Redirecting to: ${parcelId}`);
      navigate(`/${encodeURIComponent(parcelId)}`);
      setNavBusyId(null);
      return;
    }

    // Fallback: no ParcelId → focus by lot/brgy on root map
    const payload = {
      parcelId: "",
      lotNo: lot,
      barangay: brgy,
      label:
        toStr(
          tax.arpNo ??
            tax.lotNo ??
            tax.lotNo2 ??
            tax.ownerName ??
            "Selected Parcel"
        ) || "Selected Parcel",
    };
    try {
      localStorage.removeItem("taxId");
      localStorage.setItem("mapFocus", JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to write mapFocus:", e);
    }
    alert("ParcelId not found. Focusing by Lot/Barangay…");
    navigate("/");
    setNavBusyId(null);
  };

  const handleDelete = async (tax) => {
    if (!window.confirm(`Delete tax form for ${tax.ownerName}?`)) return;
    try {
      await api.delete(`/tax/${tax.id}`);
      alert("Tax form deleted successfully.");
      fetchTaxes();
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
                      disabled={navBusyId === tax.id}
                    >
                      {navBusyId === tax.id ? "Opening…" : "View on Map"}
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
}
