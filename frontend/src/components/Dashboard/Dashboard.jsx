import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import api from "../../lib/axios.js";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/* ---- Zoom to center once data is ready ---- */
function ZoomToCenterOnLoad({ fc, zoom = 19 }) {
  const map = useMap();
  useEffect(() => {
    if (!fc || !fc.features?.length) return;
    try {
      const layer = L.geoJSON(fc);
      const b = layer.getBounds();
      if (b.isValid()) {
        const c = b.getCenter();
        map.setView([c.lat, c.lng], zoom, { animate: true });
      }
    } catch (e) {
      console.error("ZoomToCenterOnLoad:", e);
    }
  }, [fc, zoom, map]);
  return null;
}

export default function DashboardContent() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [fc, setFC] = useState(null);
  const [mapObj, setMapObj] = useState(null);

  const MAX_ZOOM = 19;
  const layersRef = useRef(new Map());

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
              try {
                geom = JSON.parse(geom);
              } catch {
                geom = null;
              }
            }
            if (!geom) return null;
            const { geometry, ...props } = row;
            return { type: "Feature", properties: props, geometry: geom };
          })
          .filter(Boolean);

        setFC({ type: "FeatureCollection", features });
      } catch (e) {
        console.error(e);
        setErr("Failed to load features.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const baseStyle = useMemo(
    () => ({ color: "#1e73be", weight: 1.25, fillOpacity: 0.22 }),
    []
  );
  const highlightStyle = useMemo(
    () => ({ color: "#0b5faa", weight: 2, fillOpacity: 0.28 }),
    []
  );

  /* ---------- Key helpers (NEW) ---------- */
  const norm = (v) =>
    v === null || v === undefined ? "" : String(v).trim().toUpperCase();

  // Safely read commonly mis-cased fields coming from DB/GeoJSON
  const getProps = (p) => {
    const ParcelId = p?.ParcelId ?? p?.parcelId ?? p?.PARCELID ?? "";
    const LotNumber = p?.LotNumber ?? p?.lotNo ?? p?.lot ?? p?.LOTNUMBER ?? "";
    const BarangayNa = p?.BarangayNa ?? p?.barangay ?? p?.BRGY ?? "";
    const Area = p?.Area ?? p?.area ?? "";
    const Claimant = p?.Claimant ?? p?.claimant ?? "";
    const TiePointID = p?.TiePointID ?? p?.tiePointId ?? p?.TiePointId ?? "";
    const TiePointNa = p?.TiePointNa ?? p?.tiePointNa ?? "";
    const SurvayPlan = p?.SurvayPlan ?? p?.SurveyPlan ?? p?.surveyPlan ?? "";

    return {
      ParcelId: norm(ParcelId),
      LotNumber: norm(LotNumber),
      BarangayNa: norm(BarangayNa),
      Area: norm(Area),
      Claimant: norm(Claimant),
      TiePointID: norm(TiePointID),
      TiePointNa: norm(TiePointNa),
      SurvayPlan: norm(SurvayPlan),
    };
  };

  /**
   * Build multiple alias keys so we can find a layer by different identifiers.
   * Priority:
   *  1) parcel:<ParcelId>
   *  2) lot:<LotNumber>|brgy:<BarangayNa>
   *  3) rich:<Lot>|brgy:<Brgy>|area:<Area>|claimant:<Claimant>|tpid:<TiePointID>|tpna:<TiePointNa>|splan:<SurvayPlan>
   */
  const featureAliases = (p) => {
    const {
      ParcelId,
      LotNumber,
      BarangayNa,
      Area,
      Claimant,
      TiePointID,
      TiePointNa,
      SurvayPlan,
    } = getProps(p);

    const aliases = [];

    if (ParcelId) {
      aliases.push(`parcel:${ParcelId}`);
    }

    if (LotNumber || BarangayNa) {
      aliases.push(`lot:${LotNumber}|brgy:${BarangayNa}`);
    }

    // Rich composite: include only fields that exist to avoid noisy keys
    const parts = [];
    if (LotNumber) parts.push(`lot:${LotNumber}`);
    if (BarangayNa) parts.push(`brgy:${BarangayNa}`);
    if (Area) parts.push(`area:${Area}`);
    if (Claimant) parts.push(`claimant:${Claimant}`);
    if (TiePointID) parts.push(`tpid:${TiePointID}`);
    if (TiePointNa) parts.push(`tpna:${TiePointNa}`);
    if (SurvayPlan) parts.push(`splan:${SurvayPlan}`);
    if (parts.length) aliases.push(`rich:${parts.join("|")}`);

    // Deduplicate
    return Array.from(new Set(aliases));
  };

  /* ---------- Temp label ---------- */
  const tmpLabelIcon = (text) =>
    L.divIcon({
      className: "lot-temp-label",
      html: `<div style="
        background: rgba(255,255,255,0.9);
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0,0,0,.25);
        white-space: nowrap;
      ">${text}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  // --- Robust tax lookup that tolerates 404s and tries several routes/param casings
  const fetchTaxIdForFeature = async (p) => {
    const clean = (v) => (v === null || v === undefined ? "" : String(v).trim());
    const parcelId = clean(p?.ParcelId);
    const lotNo = clean(p?.LotNumber);
    const barangay = clean(p?.BarangayNa);

    const direct = p?.taxId ?? p?.TaxId ?? p?.tax_id ?? p?.taxID ?? null;
    if (direct) return direct;

    const tryGet = async (url, params) => {
      try {
        const r = await api.get(url, { params });
        const data = r?.data;
        if (!data) return null;

        if (Array.isArray(data)) {
          if (data.length === 0) return null;
          if (data[0]?.id) return data[0].id;
          if (data[0]?.taxId) return data[0].taxId;
        } else if (typeof data === "object") {
          if (data?.id) return data.id;
          if (data?.taxId) return data.taxId;
          if (data?.result?.id) return data.result.id;
          if (data?.result?.taxId) return data.result.taxId;
        }
        return null;
      } catch (err) {
        const status = err?.response?.status;
        if (status && status !== 404) {
          console.warn(`${url} failed`, err);
        } else {
          console.warn(`${url} returned ${status || "error"}`);
        }
        return null;
      }
    };

    if (parcelId) {
      const parcelTries = [
        { url: "/tax/lookup", params: { parcelId } },
        { url: "/tax", params: { parcelId } },
        { url: `/tax/by-parcel/${encodeURIComponent(parcelId)}` },
      ];
      for (const t of parcelTries) {
        const id = await tryGet(t.url, t.params);
        if (id) return id;
      }
    }

    if (lotNo) {
      const lotTries = [
        { url: "/tax/lookup", params: { lotNo, barangay } },
        { url: "/tax", params: { lotNo, barangay } },
        { url: `/tax/by-lot/${encodeURIComponent(lotNo)}`, params: { barangay } },
      ];
      for (const t of lotTries) {
        const id = await tryGet(t.url, t.params);
        if (id) return id;
      }
    }

    return null;
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties || {};

    // Store ALL alias keys for this layer
    const aliases = featureAliases(p);
    aliases.forEach((k) => layersRef.current.set(k, layer));

    layer.on({
      mouseover: () => layer.setStyle(highlightStyle),
      mouseout: () => layer.setStyle(baseStyle),
    });

    const uid = `open-tax-${layer._leaflet_id}`;

    const html = `
      <div style="font-size:13px;line-height:1.3">
        <strong>${p.BarangayNa ?? "Parcel"}</strong><br/>
        ${p.LotNumber ? `Lot: ${p.LotNumber}<br/>` : ""}
        ${p.ParcelId ? `ParcelId: ${p.ParcelId}<br/>` : ""}
        ${p.Area ? `Area: ${p.Area}<br/>` : ""}
        ${p.Claimant ? `Claimant: ${p.Claimant}<br/>` : ""}
        ${p.TiePointID ? `TiePointID: ${p.TiePointID}<br/>` : ""}
        ${p.TiePointNa ? `TiePointNa: ${p.TiePointNa}<br/>` : ""}
        ${p.SurvayPlan ? `SurvayPlan: ${p.SurvayPlan}<br/>` : ""}
        <div style="margin-top:6px;">
          <button id="${uid}" type="button"
            style="padding:6px 10px;border:0;border-radius:6px;background:#0b5faa;color:#fff;cursor:pointer;">
            View Tax Form
          </button>
        </div>
      </div>`;

    layer.bindPopup(html);

    layer.on("popupopen", () => {
      const btn = document.getElementById(uid);
      if (!btn) return;

      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = "Opening…";
        try {
          const taxId = await fetchTaxIdForFeature(p);

          if (taxId) {
            localStorage.setItem("taxId", taxId.toString());
            navigate("/taxform");
            return;
          }

          btn.disabled = false;
          btn.textContent = "View Tax Form";
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
          btn.disabled = false;
          btn.textContent = "View Tax Form";
          alert("Failed to fetch tax record.");
        }
      };
    });
  };

  // focus when coming from TaxForm (tries all aliases too)
  useEffect(() => {
    if (!mapObj || !fc?.features?.length) return;

    const raw = localStorage.getItem("mapFocus");
    if (!raw) return;

    let focus;
    try {
      focus = JSON.parse(raw);
    } catch {
      localStorage.removeItem("mapFocus");
      return;
    }

    // Build candidate keys from whatever we got in mapFocus
    const candidates = [];
    const P = {
      ParcelId: focus.parcelId,
      LotNumber: focus.lotNo,
      BarangayNa: focus.barangay,
      Area: focus.area,
      Claimant: focus.claimant,
      TiePointID: focus.tiePointID,
      TiePointNa: focus.tiePointNa,
      SurvayPlan: focus.survayPlan,
    };

    // Use the same alias builder
    featureAliases(P).forEach((k) => candidates.push(k));

    // Try to find a layer by any candidate key
    let targetLayer = null;
    for (const k of candidates) {
      const layer = layersRef.current.get(k);
      if (layer) {
        targetLayer = layer;
        break;
      }
    }

    if (targetLayer) {
      const bounds = targetLayer.getBounds?.();
      if (bounds && bounds.isValid()) {
        mapObj.fitBounds(bounds, { maxZoom: 18, animate: true });
      } else if (targetLayer.getLatLng) {
        mapObj.setView(targetLayer.getLatLng(), 18, { animate: true });
      }

      targetLayer.openPopup();

      try {
        const c = bounds ? bounds.getCenter() : null;
        if (c) {
          const label =
            focus.label ||
            focus.lotNo ||
            focus.parcelId ||
            "Selected Parcel";
          const marker = L.marker(c, {
            icon: tmpLabelIcon(label),
            interactive: false,
          }).addTo(mapObj);

          setTimeout(() => {
            mapObj.removeLayer(marker);
          }, 6000);
        }
      } catch {}
    } else {
      console.warn("mapFocus: no matching feature found", focus, candidates);
    }

    localStorage.removeItem("mapFocus");
  }, [mapObj, fc]);

  const fallbackCenter = useMemo(() => [13.8, 121.14], []);

  if (loading) return <p style={{ padding: 16 }}>Loading map…</p>;
  if (err) return <p style={{ padding: 16, color: "#b00020" }}>{err}</p>;
  if (!fc || !fc.features.length)
    return <p style={{ padding: 16 }}>No features to display.</p>;

  return (
    <div style={{ height: "90vh", width: "100%", position: "relative" }}>
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
          // @ts-ignore
          smoothFactor={1.2}
        />

        <ZoomToCenterOnLoad fc={fc} zoom={16.5} />
      </MapContainer>
    </div>
  );
}
