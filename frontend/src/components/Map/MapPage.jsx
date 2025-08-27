// frontend/src/components/Map/MapPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl } from "react-leaflet";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import api from "../../lib/axios.js";
import "leaflet/dist/leaflet.css";

// ensure marker assets resolve (even if we don't drop pins)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const toStr = (v) => (v == null ? "" : String(v).trim());
const normParcelId = (v) => toStr(v);

export default function MapPage() {
  const { parcelId: routeParcelId } = useParams(); // /:parcelId
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [fc, setFC] = useState(null);
  const [mapObj, setMapObj] = useState(null);

  // UI for hideable search
  const [showSearch, setShowSearch] = useState(!routeParcelId);
  const [searchPid, setSearchPid] = useState(routeParcelId || "");

  // "which parcel should auto-open?"
  const [pendingPid, setPendingPid] = useState(routeParcelId ? normParcelId(routeParcelId) : "");
  const pendingPidRef = useRef(pendingPid);          // mirror as ref so we can read in render
  const pendingLayerRef = useRef(null);              // layer that matched while rendering

  // fast lookups: ParcelId -> Leaflet layer
  const layersByParcelRef = useRef(new Map());

  const MAX_ZOOM = 19;
  const fallbackCenter = useMemo(() => [13.8, 121.14], []);
  const baseStyle = useMemo(
    () => ({ color: "#1e73be", weight: 1.25, fillOpacity: 0.22 }),
    []
  );
  const highlightStyle = useMemo(
    () => ({ color: "#0b5faa", weight: 2, fillOpacity: 0.28 }),
    []
  );

  // ----------------- load parcels -----------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get("/ibaan");
        const rows = Array.isArray(res.data) ? res.data : [res.data];

        const features = rows
          .map((row) => {
            let geom = row.geometry;
            if (typeof geom === "string" && geom.trim()) {
              try { geom = JSON.parse(geom); } catch { geom = null; }
            }
            if (!geom) return null;
            const { geometry, ...props } = row;
            return { type: "Feature", properties: props, geometry: geom };
          })
          .filter(Boolean);

        setFC({ type: "FeatureCollection", features });
      } catch (e) {
        console.error(e);
        setErr("Failed to load parcels.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // keep mirrors in sync
  useEffect(() => { pendingPidRef.current = pendingPid; }, [pendingPid]);

  // keep UI in sync with route
  useEffect(() => {
    const pid = routeParcelId ? normParcelId(routeParcelId) : "";
    setSearchPid(pid);
    setShowSearch(!pid);
    setPendingPid(pid);
  }, [routeParcelId]);

  const getPidFromProps = (p) => {
    const pid = p?.ParcelId ?? p?.parcelId ?? p?.PARCELID ?? p?.parcelID ?? "";
    const normalized = normParcelId(pid);
    console.log("Getting PID from props:", p, "-> normalized:", normalized);
    return normalized;
  };

  // reliably fit + open popup
  const focusAndOpen = useCallback((layer) => {
    console.log("focusAndOpen called with:", layer, "mapObj:", mapObj);
    
    if (!layer || !mapObj) {
      console.log("Missing layer or mapObj");
      return;
    }

    const bounds = layer.getBounds?.();
    console.log("Layer bounds:", bounds);
    
    const doOpen = () => {
      console.log("Attempting to open popup...");
      
      // Try multiple ways to open the popup
      if (layer.getPopup && layer.getPopup()) {
        console.log("Opening existing popup");
        layer.openPopup();
      } else if (layer.bindPopup) {
        console.log("Popup exists, trying to open");
        layer.openPopup();
      } else {
        console.log("Firing click event");
        try { 
          layer.fire("click"); 
        } catch (e) {
          console.error("Error firing click:", e);
        }
      }
      
      // Force highlight the layer
      layer.setStyle(highlightStyle);
    };

    if (bounds && bounds.isValid()) {
      console.log("Fitting bounds and opening popup");
      mapObj.fitBounds(bounds, { maxZoom: 18, animate: true });
      
      // Try opening immediately
      setTimeout(doOpen, 100);
      
      // Also try after map movement
      let opened = false;
      const onMoveEnd = () => {
        if (opened) return;
        opened = true;
        mapObj.off("moveend", onMoveEnd);
        setTimeout(doOpen, 100);
      };
      mapObj.on("moveend", onMoveEnd);
      
      // Fallback
      setTimeout(() => {
        if (!opened) {
          mapObj.off("moveend", onMoveEnd);
          doOpen();
        }
      }, 1000);
    } else {
      console.log("No valid bounds, opening popup directly");
      doOpen();
    }
  }, [mapObj, highlightStyle]);

  // initial fit (no pid)
  useEffect(() => {
    if (!mapObj || !fc?.features?.length) return;
    if (!routeParcelId) {
      const layer = L.geoJSON(fc);
      const b = layer.getBounds();
      if (b.isValid()) mapObj.fitBounds(b, { animate: true });
    }
  }, [routeParcelId, fc, mapObj]);

  // search submit -> navigate and arm pendingPid, then show popup
  const submitSearch = (e) => {
    e?.preventDefault?.();
    const pid = normParcelId(searchPid);
    if (!pid) {
      alert("Please enter a valid Parcel ID");
      return;
    }
    
    console.log("Searching for parcel:", pid);
    console.log("Available parcels:", Array.from(layersByParcelRef.current.keys()));
    
    // Find the layer for this parcel ID - try different formats
    let targetLayer = layersByParcelRef.current.get(pid);
    
    // If not found, try as number
    if (!targetLayer && !isNaN(pid)) {
      targetLayer = layersByParcelRef.current.get(Number(pid));
    }
    
    // If still not found, try as string
    if (!targetLayer) {
      targetLayer = layersByParcelRef.current.get(String(pid));
    }
    
    // If still not found, search through all layers manually
    if (!targetLayer) {
      for (const [key, layer] of layersByParcelRef.current.entries()) {
        if (String(key).toLowerCase() === String(pid).toLowerCase()) {
          targetLayer = layer;
          break;
        }
      }
    }
    
    if (!targetLayer) {
      const availableParcels = Array.from(layersByParcelRef.current.keys()).slice(0, 10).join(", ");
      alert(`Parcel with ID "${pid}" not found.\n\nAvailable parcels (first 10): ${availableParcels}...`);
      return;
    }

    console.log("Found target layer:", targetLayer);
    console.log("Layer has popup?", targetLayer.getPopup && targetLayer.getPopup());
    console.log("MapObj available?", !!mapObj);

    // Hide search first
    setShowSearch(false);
    
    // Wait a bit for UI to update, then focus and open
    setTimeout(() => {
      console.log("Attempting to focus and open popup...");
      
      // Try the focusAndOpen function first
      focusAndOpen(targetLayer);
      
      // Also try directly simulating a click as backup
      setTimeout(() => {
        console.log("Trying direct click simulation...");
        try {
          // Simulate the click event that normally opens the popup
          targetLayer.fire('click', {
            latlng: targetLayer.getBounds().getCenter(),
            layerPoint: mapObj.latLngToLayerPoint(targetLayer.getBounds().getCenter()),
            containerPoint: mapObj.latLngToContainerPoint(targetLayer.getBounds().getCenter())
          });
        } catch (e) {
          console.error("Error with click simulation:", e);
          
          // Last resort - try opening popup directly
          if (targetLayer.getPopup()) {
            console.log("Last resort: opening popup directly");
            targetLayer.openPopup(targetLayer.getBounds().getCenter());
          }
        }
      }, 500);
      
    }, 200);
    
    // Also update the URL without navigation
    window.history.pushState(null, '', `/${encodeURIComponent(pid)}`);
  };

  // After render, if a pending layer exists (or shows up), open it.
  useEffect(() => {
    if (!pendingPid) return;
    let n = 0;
    const max = 25;
    const tick = () => {
      const pid = pendingPidRef.current;
      if (!pid) return true; // done/canceled

      let lyr = layersByParcelRef.current.get(pid) || pendingLayerRef.current;
      if (lyr && mapObj) {
        focusAndOpen(lyr);
        pendingLayerRef.current = null;
        setPendingPid("");            // safe here (post-render)
        return true;
      }
      n += 1;
      return n >= max;
    };

    // try immediately and keep polling briefly
    if (tick()) return;
    const iv = setInterval(() => { if (tick()) clearInterval(iv); }, 100);
    return () => clearInterval(iv);
  }, [pendingPid, mapObj, focusAndOpen]);

  // lightweight tax lookup using lot+barangay
  const fetchTaxIdForFeature = useCallback(async (p) => {
    const lotNo = toStr(p?.LotNumber);
    const barangay = toStr(p?.BarangayNa);
    const tryGet = async (url, params) => {
      try {
        const r = await api.get(url, { params });
        const data = r?.data;
        if (!data) return null;
        if (Array.isArray(data)) return data[0]?.id ?? data[0]?.taxId ?? null;
        if (typeof data === "object") return data?.id ?? data?.taxId ?? data?.result?.id ?? data?.result?.taxId ?? null;
        return null;
      } catch { return null; }
    };
    if (lotNo) {
      for (const t of [
        { url: "/tax/lookup", params: { lotNo, barangay } },
        { url: "/tax",        params: { lotNo, barangay } },
        { url: `/tax/by-lot/${encodeURIComponent(lotNo)}`, params: { barangay } },
      ]) {
        const id = await tryGet(t.url, t.params);
        if (id) return id;
      }
    }
    return null;
  }, []);

  // ----------------- per-feature wiring -----------------
  const onEachFeature = (feature, layer) => {
    const p = feature.properties || {};
    const pid = getPidFromProps(p);
    console.log("Processing feature with PID:", pid, "Properties:", p);
    
    if (pid) {
      layersByParcelRef.current.set(pid, layer);
      // Also store as string and number variants to improve search
      layersByParcelRef.current.set(String(pid), layer);
      if (!isNaN(pid)) {
        layersByParcelRef.current.set(Number(pid), layer);
      }
      console.log("Stored layer for PID:", pid);
    }

    layer.on({
      mouseover: () => layer.setStyle(highlightStyle),
      mouseout: () => layer.setStyle(baseStyle),
      click: () => {
        if (!pid) return;
        if (!location.pathname.endsWith(`/${pid}`)) {
          navigate(`/${encodeURIComponent(pid)}`);
        }
        setShowSearch(false);
        setPendingPid(pid); // event handler (safe)
        focusAndOpen(layer);
      },
    });

    // Popup HTML with enhanced information display
    const uidTax = `open-tax-${layer._leaflet_id}`;
    const uidParcel = `open-parcel-${layer._leaflet_id}`;
    const html = `
      <div style="font-size:13px;line-height:1.4;max-width:280px;">
        <div style="border-bottom:1px solid #e0e6ed;padding-bottom:8px;margin-bottom:8px;">
          <strong style="font-size:14px;color:#0b5faa;">${p.BarangayNa ?? "Parcel Information"}</strong>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;">
          ${p.ParcelId ? `<div><strong>Parcel ID:</strong></div><div>${p.ParcelId}</div>` : ""}
          ${p.LotNumber ? `<div><strong>Lot:</strong></div><div>${p.LotNumber}</div>` : ""}
          ${p.BlockNumber ? `<div><strong>Block:</strong></div><div>${p.BlockNumber}</div>` : ""}
          ${p.Area ? `<div><strong>Area:</strong></div><div>${p.Area}</div>` : ""}
          ${p.Claimant ? `<div><strong>Claimant:</strong></div><div style="word-break:break-word;">${p.Claimant}</div>` : ""}
          ${p.TiePointNa ? `<div><strong>Tie Point:</strong></div><div>${p.TiePointNa}</div>` : ""}
          ${p.SurvayPlan ? `<div><strong>Survey Plan:</strong></div><div>${p.SurvayPlan}</div>` : ""}
          ${p.SurveyId ? `<div><strong>Survey ID:</strong></div><div>${p.SurveyId}</div>` : ""}
        </div>
        
        ${p.Tax_Amount || p.Due_Date || p.AmountPaid ? `
          <div style="border-top:1px solid #e0e6ed;padding-top:8px;margin-top:8px;">
            <div style="font-weight:600;color:#0b5faa;margin-bottom:4px;">Tax Information</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;">
              ${p.Tax_Amount ? `<div><strong>Tax Amount:</strong></div><div>₱${parseFloat(p.Tax_Amount).toLocaleString()}</div>` : ""}
              ${p.Due_Date ? `<div><strong>Due Date:</strong></div><div>${new Date(p.Due_Date).toLocaleDateString()}</div>` : ""}
              ${p.AmountPaid ? `<div><strong>Amount Paid:</strong></div><div>₱${parseFloat(p.AmountPaid).toLocaleString()}</div>` : ""}
              ${p.Date_paid ? `<div><strong>Date Paid:</strong></div><div>${new Date(p.Date_paid).toLocaleDateString()}</div>` : ""}
            </div>
          </div>
        ` : ""}
        
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:6px;">
          <button id="${uidTax}" type="button"
            style="padding:8px 12px;border:0;border-radius:6px;background:#0b5faa;color:#fff;cursor:pointer;font-weight:600;transition:background-color 0.2s;">
            View Tax Form
          </button>
          <button id="${uidParcel}" type="button"
            style="padding:8px 12px;border:1px solid #d0d7de;border-radius:6px;background:#fff;color:#0b5faa;cursor:pointer;font-weight:600;transition:all 0.2s;">
            View Full Parcel Details
          </button>
        </div>
      </div>`;
    layer.bindPopup(html, { maxWidth: 300, className: 'custom-popup' });

    layer.on("popupopen", () => {
      const btnTax = document.getElementById(uidTax);
      const btnParcel = document.getElementById(uidParcel);

      if (btnTax) {
        btnTax.onmouseover = () => btnTax.style.backgroundColor = "#083d73";
        btnTax.onmouseout = () => btnTax.style.backgroundColor = "#0b5faa";
        
        btnTax.onclick = async () => {
          btnTax.disabled = true;
          btnTax.textContent = "Opening…";
          try {
            const taxId = await fetchTaxIdForFeature(p);
            if (taxId) {
              localStorage.setItem("taxId", String(taxId));
              navigate("/taxform");
              return;
            }
            btnTax.disabled = false;
            btnTax.textContent = "View Tax Form";
            const wantCreate = window.confirm(
              "No tax record found for this lot. Do you want to add a new tax form?"
            );
            if (!wantCreate) return;
            const prefill = {
              parcelId: p?.ParcelId ?? "",
              lotNo: p?.LotNumber ?? "",
              barangay: p?.BarangayNa ?? "",
            };
            localStorage.removeItem("taxId");
            localStorage.setItem("prefillTaxData", JSON.stringify(prefill));
            navigate("/taxform");
          } catch (e) {
            console.error(e);
            btnTax.disabled = false;
            btnTax.textContent = "View Tax Form";
            alert("Failed to fetch tax record.");
          }
        };
      }

      if (btnParcel) {
        btnParcel.onmouseover = () => {
          btnParcel.style.backgroundColor = "#f6f8fa";
          btnParcel.style.borderColor = "#0b5faa";
        };
        btnParcel.onmouseout = () => {
          btnParcel.style.backgroundColor = "#fff";
          btnParcel.style.borderColor = "#d0d7de";
        };
        
        btnParcel.onclick = () => {
          const lines = [
            `Parcel ID: ${p?.ParcelId ?? "—"}`,
            `Survey ID: ${p?.SurveyId ?? "—"}`,
            `Block Number: ${p?.BlockNumber ?? "—"}`,
            `Lot Number: ${p?.LotNumber ?? "—"}`,
            `Area: ${p?.Area ?? "—"}`,
            `Barangay: ${p?.BarangayNa ?? "—"}`,
            `Claimant: ${p?.Claimant ?? "—"}`,
            `Tie Point: ${p?.TiePointNa ?? "—"}`,
            `Survey Plan: ${p?.SurvayPlan ?? "—"}`,
            `Coordinates: ${p?.Coordinate ?? "—"}`,
            `XI: ${p?.XI ?? "—"}`,
            `YI: ${p?.YI ?? "—"}`,
            `Longitude: ${p?.LongitudeI ?? "—"}`,
            `Latitude: ${p?.LatitudeI ?? "—"}`,
            `Length: ${p?.LengthI ?? "—"}`,
            `Area (I): ${p?.AreaI ?? "—"}`,
            `Version: ${p?.VersionI ?? "—"}`,
            `Tax ID: ${p?.tax_ID ?? "—"}`,
            `Tax Amount: ${p?.Tax_Amount ? `₱${parseFloat(p.Tax_Amount).toLocaleString()}` : "—"}`,
            `Due Date: ${p?.Due_Date ? new Date(p.Due_Date).toLocaleDateString() : "—"}`,
            `Amount Paid: ${p?.AmountPaid ? `₱${parseFloat(p.AmountPaid).toLocaleString()}` : "—"}`,
            `Date Paid: ${p?.Date_paid ? new Date(p.Date_paid).toLocaleDateString() : "—"}`,
          ].join("\n");
          alert(`Complete Parcel Information\n\n${lines}`);
        };
      }
    });

    // If this layer matches the pending PID, remember it (DON'T set state here)
    if (pendingPidRef.current && pid === pendingPidRef.current) {
      pendingLayerRef.current = layer;
      // Opening will be handled in useEffect after render
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading map…</p>;
  if (err) return <p style={{ padding: 16, color: "#b00020" }}>{err}</p>;
  if (!fc || !fc.features?.length) return <p style={{ padding: 16 }}>No features to display.</p>;

  return (
    <div style={{ height: "90vh", width: "100%", position: "relative" }}>
      {/* Add some custom CSS for popup styling */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>

      {/* 🔎 hide-able search */}
      {!showSearch && (
        <button
          onClick={() => setShowSearch(true)}
          title="Search ParcelId"
          style={{
            position: "absolute", zIndex: 1100, top: 12, left: 12,
            width: 40, height: 40, borderRadius: 8, border: "1px solid #d0d7de",
            background: "#fff", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,.15)",
          }}
        >
          🔎
        </button>
      )}

      {showSearch && (
        <div
          style={{
            position: "absolute", zIndex: 1100, top: 12, left: 12,
            padding: 10, background: "#fff", border: "1px solid #d0d7de",
            borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,.15)",
            display: "flex", gap: 8, alignItems: "center",
          }}
        >
          <form onSubmit={submitSearch} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Enter ParcelId…"
              value={searchPid}
              onChange={(e) => setSearchPid(e.target.value)}
              style={{
                width: 220, padding: "6px 10px", borderRadius: 8,
                border: "1px solid #c7ccd1", outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "6px 12px", borderRadius: 8, border: "0",
                background: "#0b5faa", color: "#fff", fontWeight: 600, cursor: "pointer",
              }}
            >
              Go
            </button>
          </form>

          <button
            onClick={() => setShowSearch(false)}
            title="Hide"
            style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid #d0d7de",
              background: "#fff", cursor: "pointer",
            }}
          >
            Hide
          </button>
        </div>
      )}

      <MapContainer
        center={fallbackCenter}
        zoom={12}
        maxZoom={MAX_ZOOM}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
        updateWhenIdle
        zoomAnimation
        wheelPxPerZoomLevel={160}
        whenCreated={setMapObj}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={MAX_ZOOM}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Mapbox Streets">
            <TileLayer
              url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
              attribution="&copy; Mapbox &copy; OpenStreetMap"
              maxZoom={MAX_ZOOM}
              tileSize={512}
              zoomOffset={-1}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Mapbox Satellite">
            <TileLayer
              url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
              attribution="Imagery © Mapbox, © Maxar"
              maxZoom={MAX_ZOOM}
              tileSize={512}
              zoomOffset={-1}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Esri World Imagery">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles © Esri"
              maxZoom={MAX_ZOOM}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <GeoJSON
          data={fc}
          style={baseStyle}
          onEachFeature={onEachFeature}
          bubblingMouseEvents={false}
          smoothFactor={1.2}
        />
      </MapContainer>
    </div>
  );
}