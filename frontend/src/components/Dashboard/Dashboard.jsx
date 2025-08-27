import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl } from "react-leaflet";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import api from "../../lib/axios.js";
import "leaflet/dist/leaflet.css";

// ✅ make sure marker icons load in Vite/CRA
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
const up = (v) => toStr(v).toUpperCase();

export default function MapPage() {
  const { parcelId: routeParcelId } = useParams();           // ← /map/:parcelId
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [fc, setFC] = useState(null);
  const [mapObj, setMapObj] = useState(null);

  const geojsonRef = useRef(null);
  const pinRef = useRef(null);
  const labelRef = useRef(null);

  // tiles & styles
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

  const tmpLabelIcon = (text) =>
    L.divIcon({
      className: "lot-temp-label",
      html: `<div style="
        background: rgba(255,255,255,.95);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0,0,0,.25);
        white-space: nowrap;
      ">${text}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  // Load parcels (ibaan) once
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

  // Find feature by ParcelId (string-compare, case-insensitive, forgiving keys)
  const findFeatureByParcelId = useCallback((pid) => {
    if (!pid || !fc?.features?.length) return null;
    const needle = toStr(pid);
    for (const feat of fc.features) {
      const p = feat.properties || {};
      const found =
        toStr(p.ParcelId) === needle ||
        toStr(p.parcelId) === needle ||
        toStr(p.PARCELID) === needle ||
        toStr(p.parcelID) === needle;
      if (found) return feat;
    }
    return null;
  }, [fc]);

  // Focus a feature (fit, pin, open popup)
  const focusFeature = useCallback((feat, label = "") => {
    if (!feat || !mapObj) return;
    try {
      const temp = L.geoJSON(feat);
      const bounds = temp.getBounds();
      const c = bounds.isValid() ? bounds.getCenter() : null;
      if (!c) return;

      mapObj.fitBounds(bounds, { maxZoom: 18, animate: true });

      // remove old markers
      if (pinRef.current) mapObj.removeLayer(pinRef.current);
      if (labelRef.current) mapObj.removeLayer(labelRef.current);

      // drop pin + label
      pinRef.current = L.marker([c.lat, c.lng], { zIndexOffset: 9999 }).addTo(mapObj);
      labelRef.current = L.marker([c.lat, c.lng], {
        icon: tmpLabelIcon(label || "Selected Parcel"),
        interactive: false,
        zIndexOffset: 10000,
      }).addTo(mapObj);

      // try opening the layer's popup
      const gj = geojsonRef.current;
      if (gj?.getLayers) {
        const lyr = gj.getLayers().find(
          (ly) => ly?.feature === feat
        );
        if (lyr) lyr.openPopup();
      }
    } catch (e) {
      console.warn("focusFeature error:", e);
    }
  }, [mapObj]);

  // When route changes (/map/:parcelId), find and focus
  useEffect(() => {
    if (!mapObj || !fc?.features?.length) return;
    if (!routeParcelId) {
      // no param: auto-zoom to all
      const layer = L.geoJSON(fc);
      const b = layer.getBounds();
      if (b.isValid()) mapObj.fitBounds(b, { animate: true });
      return;
    }
    const feat = findFeatureByParcelId(routeParcelId);
    if (!feat) {
      console.warn("Parcel not found:", routeParcelId);
      // optional: toast/alert
      return;
    }
    const label = `Parcel ${routeParcelId}`;
    focusFeature(feat, label);
  }, [routeParcelId, fc, mapObj, findFeatureByParcelId, focusFeature]);

  // Per-feature behavior: highlight & clicking a parcel updates URL and focuses it
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => layer.setStyle(highlightStyle),
      mouseout: () => layer.setStyle(baseStyle),
      click: () => {
        const p = feature.properties || {};
        const pid =
          toStr(p.ParcelId) ||
          toStr(p.parcelId) ||
          toStr(p.PARCELID) ||
          toStr(p.parcelID);
        if (pid) {
          // Update URL and focus immediately
          if (!location.pathname.endsWith(`/${pid}`)) {
            navigate(`/${encodeURIComponent(pid)}`);
          }
          focusFeature(feature, `Parcel ${pid}`);
        }
      },
    });

    const p = feature.properties || {};
    layer.bindPopup(
      `
      <div style="font-size:13px;line-height:1.3">
        <strong>${p.BarangayNa ?? "Parcel"}</strong><br/>
        ${p.LotNumber ? `Lot: ${p.LotNumber}<br/>` : ""}
        ${p.ParcelId ? `ParcelId: ${p.ParcelId}<br/>` : ""}
        ${p.Area ? `Area: ${p.Area}<br/>` : ""}
        ${p.Claimant ? `Claimant: ${p.Claimant}<br/>` : ""}
        ${p.TiePointID ? `TiePointID: ${p.TiePointID}<br/>` : ""}
        ${p.TiePointNa ? `TiePointNa: ${p.TiePointNa}<br/>` : ""}
        ${p.SurvayPlan ? `SurvayPlan: ${p.SurvayPlan}<br/>` : ""}
      </div>`
    );
  };

  if (loading) return <p style={{ padding: 16 }}>Loading map…</p>;
  if (err) return <p style={{ padding: 16, color: "#b00020" }}>{err}</p>;
  if (!fc || !fc.features?.length) return <p style={{ padding: 16 }}>No features to display.</p>;

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
          ref={geojsonRef}
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
