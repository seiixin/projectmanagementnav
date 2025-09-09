// src/components/Taytay/Taytay.jsx
import React, { useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  ScaleControl,
  ZoomControl,
  useMap,
  Marker,
  Tooltip,
  GeoJSON,
  Pane,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import Sidebar from "../Sidebar/Sidebar";
import { TAYTAY_PARCELS } from "./taytayParcels";

/* ===============================
   Icons / Tooltip HTML
================================= */
const parcelDivIcon = L.divIcon({
  className: "parcel-marker",
  html: `
    <div style="
      width:28px;height:28px;border-radius:50%;
      background:#a855f7; box-shadow:0 0 0 2px white, 0 2px 8px rgba(0,0,0,.4);
      display:grid;place-items:center; color:white; font-weight:700; font-size:14px;
    ">
      •
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

function parcelTooltipHTML(p = {}) {
  const fields = [
    "ID",
    "ParcelId",
    "LotNumber",
    "BlockNumbe",
    "SurveyPlan",
    "Claimant",
    "BarangayNa",
    "Area",
  ];
  const pretty = (v) =>
    v === null || v === undefined || v === ""
      ? `<span style="opacity:.55">—</span>`
      : String(v);

  const rows = fields
    .map((k, i) => {
      const val = p[k];
      const bg = i % 2 ? "#f9fafb" : "#ffffff";
      return `
        <tr style="background:${bg}">
          <td style="
            padding:8px 12px;
            font-weight:600;
            background:${bg};
            border-bottom:1px solid #e5e7eb;
            border-right:1px solid #e5e7eb;
            width:40%;
            color:#1e293b;
          ">
            ${k}
          </td>
          <td style="
            padding:8px 12px;
            border-bottom:1px solid #e5e7eb;
            color:#111827;
            font-weight:400;
          ">
            ${pretty(val)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="max-width:520px;font:14px/1.5 system-ui;color:#111">
      <div style="
        font-weight:700;
        margin-bottom:10px;
        font-size:18px;
        color:#6b21a8;
      ">
        Taytay Parcel ${p?.LotNumber ? `• ${p.LotNumber}` : ""}
      </div>
      <div style="
        border:1px solid #e5e7eb;
        border-radius:12px;
        overflow:hidden;
        background:#fff;
        box-shadow:0 8px 20px rgba(0,0,0,.15);
      ">
        <table style="border-collapse:collapse;width:100%">${rows}</table>
      </div>
    </div>
  `;
}

/* ===============================
   DUMMY DATA (GeoJSON) so layers show
   NOTE: GeoJSON uses [lng, lat]
================================= */
const DUMMY_BUILDINGS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Bldg A" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [121.1305, 14.5585],
          [121.1310, 14.5585],
          [121.1310, 14.5589],
          [121.1305, 14.5589],
          [121.1305, 14.5585],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Bldg B" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [121.1320, 14.5590],
          [121.1326, 14.5590],
          [121.1326, 14.5596],
          [121.1320, 14.5596],
          [121.1320, 14.5590],
        ]],
      },
    },
  ],
};

const DUMMY_ROADS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Main Rd" },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.1280, 14.5575],
          [121.1300, 14.5580],
          [121.1335, 14.5590],
          [121.1365, 14.5600],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Side St" },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.1315, 14.5570],
          [121.1318, 14.5582],
          [121.1319, 14.5592],
        ],
      },
    },
  ],
};

const DUMMY_LANDCOVER = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { class: "Vegetation" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [121.1275, 14.5595],
          [121.1298, 14.5595],
          [121.1307, 14.5608],
          [121.1280, 14.5610],
          [121.1275, 14.5595],
        ]],
      },
    },
  ],
};

const DUMMY_BRGY_BOUNDS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Barangay Boundary" },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.1265, 14.5580],
          [121.1290, 14.5590],
          [121.1320, 14.5600],
          [121.1350, 14.5610],
        ],
      },
    },
  ],
};

const DUMMY_WATER = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Creek" },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.1292, 14.5565],
          [121.1300, 14.5574],
          [121.1310, 14.5583],
          [121.1322, 14.5592],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Pond" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [121.1340, 14.5584],
          [121.1347, 14.5584],
          [121.1347, 14.5590],
          [121.1340, 14.5590],
          [121.1340, 14.5584],
        ]],
      },
    },
  ],
};

/* ===============================
   Main component
================================= */
export default function Taytay() {
  // ✅ Preselect layers so they render immediately
  const [selected] = useState(
    new Set([
      "taytay_parcel_main",
      "taytay_buildings",
      "taytay_roads",
      "taytay_landcover",
      "taytay_brgy_bounds",
      "taytay_water",
    ])
  );

  const [layerOrder] = useState([
    // bottom ➜ top
    "taytay_landcover",
    "taytay_water",
    "taytay_brgy_bounds",
    "taytay_roads",
    "taytay_buildings",
    "taytay_parcel_main",
  ]);

  const [layerOpacity] = useState({
    taytay_parcel_main: 0.9,
    taytay_buildings: 0.85,
    taytay_roads: 0.95,
    taytay_landcover: 0.6,
    taytay_brgy_bounds: 0.8,
    taytay_water: 0.7,
  });

  const [basemapOpacity] = useState(1);
  const [activeBase] = useState("osm-standard");

  const phBounds = useMemo(
    () => [
      [8.0, 116.7], // SW
      [19.5, 130.6], // NE
    ],
    []
  );

  const layerRegistry = useMemo(() => createLayerRegistry(), []);
  const basemapRegistry = useMemo(() => createBasemapRegistry(), []);

  // Compute Taytay bounds once (for auto-zoom on toggle)
  const taytayBounds = useMemo(() => geojsonToBounds(TAYTAY_PARCELS), []);

  const legendItems = useMemo(
    () => [
      { id: "taytay_parcel_main", title: "Parcels", color: "#a855f7", kind: "line" },
      { id: "taytay_buildings", title: "Building Footprints", color: "#ef4444", kind: "fill" },
      { id: "taytay_roads", title: "Road Network", color: "#f59e0b", kind: "line" },
      { id: "taytay_landcover", title: "Land Cover 2020", color: "#10b981", kind: "fill" },
      { id: "taytay_brgy_bounds", title: "Barangay Boundaries", color: "#3b82f6", kind: "line" },
      { id: "taytay_water", title: "Rivers / Lakes", color: "#38bdf8", kind: "line" },
    ],
    []
  );

  const selectedIds = useMemo(
    () => layerOrder.filter((id) => selected.has(id)),
    [layerOrder, selected]
  );

  return (
    <div style={styles.app}>
      {/* External Sidebar */}
      <div style={styles.sidebarWrap}>
        <Sidebar />
      </div>

      {/* Map area */}
      <div style={styles.mapWrap}>
        <MapContainer
          maxBounds={phBounds}
          maxBoundsViscosity={1.0}
          minZoom={5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <FitPHOnMount bounds={phBounds} padding={[24, 24]} />

          {/* Search box */}
          <SearchLocationControl />

          {/* Auto-zoom to Taytay parcels on first enable */}
          <FitToBoundsOnToggle
            watchId="taytay_parcel_main"
            enabled={selected.has("taytay_parcel_main")}
            bounds={taytayBounds}
          />

          {/* Vector pane above tiles */}
          <Pane name="pane-parcels" style={{ zIndex: 650 }} />
          {/* Markers pane (for search result marker) */}
          <Pane name="pane-parcel-markers" style={{ zIndex: 700 }} />

          {/* Basemap */}
          {React.cloneElement(basemapRegistry[activeBase], { opacity: basemapOpacity })}

          {/* Overlays respecting order + opacity */}
          {selectedIds.map((id, index) => {
            const node = layerRegistry[id];
            if (!node) return null;
            const opacity = layerOpacity[id] ?? 0.8;
            const zIndex = 400 + index;
            return React.cloneElement(node, { key: id, opacity, zIndex });
          })}

          <ScaleControl position="bottomleft" />
          <ZoomControl position="bottomright" />
        </MapContainer>

        {/* Legend */}
        <Legend items={legendItems} activeIds={selectedIds} />
      </div>
    </div>
  );
}

/* ===============================
   Helpers
================================= */

/** Fit Philippines once on mount */
function FitPHOnMount({ bounds, padding = [20, 20] }) {
  const map = useMap();
  React.useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding });
    }, 0);
  }, [map, bounds, padding]);
  return null;
}

/** Auto-fit helper when a layer becomes enabled */
function FitToBoundsOnToggle({ watchId, enabled, bounds, padding = [24, 24] }) {
  const map = useMap();
  const didFitRef = React.useRef(false);
  React.useEffect(() => {
    if (!enabled || !bounds) return;
    if (didFitRef.current) return; // only first enable
    didFitRef.current = true;
    const t = setTimeout(() => {
      try {
        map.fitBounds(bounds, { padding });
      } catch {}
    }, 60);
    return () => clearTimeout(t);
  }, [map, enabled, bounds, padding, watchId]);
  React.useEffect(() => {
    if (!enabled) didFitRef.current = false;
  }, [enabled]);
  return null;
}

/** Compute bounds of a (Multi)Polygon GeoJSON (lon/lat to Leaflet lat/lng) */
function geojsonToBounds(geojson) {
  const b = L.latLngBounds();
  const push = (lng, lat) => b.extend([lat, lng]); // Leaflet expects [lat, lng]
  (geojson.features || []).forEach((f) => {
    const g = f.geometry;
    if (!g) return;
    if (g.type === "Polygon") {
      g.coordinates.forEach((ring) => ring.forEach(([lng, lat]) => push(lng, lat)));
    } else if (g.type === "MultiPolygon") {
      g.coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach(([lng, lat]) => push(lng, lat))));
    }
  });
  return b.isValid() ? b : null;
}

/** Search box using OpenStreetMap Nominatim (no extra packages) */
function SearchLocationControl() {
  const map = useMap();
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [chosen, setChosen] = React.useState(null); // {lat, lon, name}

  const boxRef = React.useRef(null);
  const abortRef = React.useRef(null);

  React.useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function runSearch(text) {
    if (!text || text.trim().length < 2) {
      setHits([]);
      return;
    }
    try {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", text);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "8");
      url.searchParams.set("countrycodes", "ph"); // remove for global
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { "Accept-Language": "en" },
      });
      if (!res.ok) throw new Error("search failed");
      const data = await res.json();
      setHits(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setHits([]);
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const t = setTimeout(() => runSearch(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  function choose(hit) {
    const lat = parseFloat(hit.lat);
    const lon = parseFloat(hit.lon);
    const name = hit.display_name;
    setChosen({ lat, lon, name });
    setOpen(false);
    setQ(name);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 16, { duration: 0.8 });
    }
  }

  return (
    <>
      {/* UI overlay */}
      <div
        ref={boxRef}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1000,
          width: 340,
          maxWidth: "calc(100vw - 24px)",
          boxShadow: "0 8px 24px rgba(0,0,0,.35)",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(20,24,40,.9)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search place, barangay, city…"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(12,16,28,.9)",
              color: "white",
              font: "14px/1.2 system-ui",
              outline: "none",
            }}
          />
          <button
            onClick={() => runSearch(q)}
            title="Search"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(12,16,28,.9)",
              color: "white",
              font: "14px/1.2 system-ui",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </div>

        {open && (loading || hits.length > 0) && (
          <div
            style={{
              maxHeight: 320,
              overflow: "auto",
              borderTop: "1px solid rgba(255,255,255,.06)",
              background: "rgba(14,18,32,.95)",
            }}
          >
            {loading && (
              <div style={{ padding: 12, color: "#9ca3af", font: "13px/1.3 system-ui" }}>Searching…</div>
            )}
            {!loading &&
              hits.map((h) => (
                <div
                  key={h.place_id}
                  onClick={() => choose(h)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    color: "white",
                    font: "13px/1.35 system-ui",
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                    display: "flex",
                    gap: 8,
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div style={{ opacity: 0.95, whiteSpace: "nowrap" }}>Result</div>
                  <div style={{ opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.display_name}
                  </div>
                </div>
              ))}
            {!loading && hits.length === 0 && q.trim().length >= 2 && (
              <div style={{ padding: 12, color: "#9ca3af", font: "13px/1.3 system-ui" }}>No results</div>
            )}
          </div>
        )}
      </div>

      {/* Marker on chosen search result */}
      {chosen && (
        <Marker position={[chosen.lat, chosen.lon]} icon={parcelDivIcon} pane="pane-parcel-markers">
          <Tooltip permanent offset={[0, -12]}>{chosen.name}</Tooltip>
        </Marker>
      )}
    </>
  );
}

/** Simple legend */
function Legend({ items = [], activeIds = [] }) {
  const active = new Set(activeIds);
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        zIndex: 800,
        background: "rgba(15,23,42,.9)",
        color: "#e2e8f0",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 10,
        padding: 8,
        minWidth: 220,
        boxShadow: "0 8px 24px rgba(0,0,0,.35)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend</div>
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "4px 0",
            opacity: active.has(it.id) ? 1 : 0.45,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 3,
              background: it.color,
              border: "1px solid rgba(0,0,0,.4)",
            }}
          />
          <span>{it.title}</span>
        </div>
      ))}
    </div>
  );
}

/** Overlay registry (using dummy GeoJSON instead of WMS for now) */
function createLayerRegistry() {
  const taytayStyle = {
    color: "#a855f7",
    weight: 3,
    opacity: 1,
    fillColor: "#a855f7",
    fillOpacity: 0.2,
  };

  const taytayData = TAYTAY_PARCELS;

  const onEachTaytayFeature = (feature, layer) => {
    const props = feature?.properties || {};

    const attach = (lyr) => {
      try {
        lyr.setStyle?.({ weight: 3, fillOpacity: 0.2, color: "#a855f7", fillColor: "#a855f7" });
      } catch {}
      lyr.on?.({
        mouseover: (e) => {
          e.target.setStyle({ weight: 5, fillOpacity: 0.32 });
          try {
            e.target.bringToFront();
          } catch {}
        },
        mouseout: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.2 }),
        click: (e) => {
          let at = null;
          try {
            at = e.target.getBounds?.().getCenter?.();
          } catch {}
          if (!at) at = e.latlng;

          const html = parcelTooltipHTML(props);

          try {
            e.target.unbindTooltip();
          } catch {}
          e.target.bindTooltip(html, {
            direction: "top",
            sticky: true,
            opacity: 1,
            className: "parcel-tooltip",
          });
          try {
            e.target.openTooltip(at);
          } catch {}
        },
      });
    };

    if (typeof layer.eachLayer === "function") {
      layer.eachLayer((child) => attach(child));
    } else {
      attach(layer);
    }

    // pointer cursor
    try {
      const paneEl = layer.getPane?.() || layer._path?.parentElement;
      if (paneEl && paneEl.style) paneEl.style.cursor = "pointer";
    } catch {}
  };

  // Styles for each dummy layer
  const styleBuildings = {
    color: "#ef4444",
    weight: 1.5,
    fillColor: "#ef4444",
    fillOpacity: 0.55,
  };

  const styleRoads = {
    color: "#f59e0b",
    weight: 4,
    opacity: 0.95,
  };

  const styleLandcover = {
    color: "#10b981",
    weight: 1,
    fillColor: "#10b981",
    fillOpacity: 0.45,
    opacity: 0.8,
  };

  const styleBrgy = {
    color: "#3b82f6",
    weight: 2.5,
    dashArray: "6,4",
    opacity: 0.9,
  };

  const styleWaterLine = {
    color: "#38bdf8",
    weight: 3,
    opacity: 0.9,
  };

  const styleWaterPoly = {
    color: "#38bdf8",
    weight: 1.2,
    fillColor: "#38bdf8",
    fillOpacity: 0.4,
    opacity: 0.9,
  };

  return {
    // 1) Parcels (your existing vector)
    taytay_parcel_main: (
      <GeoJSON
        data={taytayData}
        style={() => taytayStyle}
        onEachFeature={onEachTaytayFeature}
        pane="pane-parcels"
        interactive={true}
        bubblingMouseEvents={true}
      />
    ),

    // 2) Building Footprints (DUMMY)
    taytay_buildings: (
      <GeoJSON
        data={DUMMY_BUILDINGS}
        style={() => styleBuildings}
        onEachFeature={(f, layer) => {
          layer.bindTooltip(`Building: ${f?.properties?.name ?? "N/A"}`);
        }}
      />
    ),

    // 3) Road Network (DUMMY)
    taytay_roads: (
      <GeoJSON
        data={DUMMY_ROADS}
        style={() => styleRoads}
        onEachFeature={(f, layer) => {
          layer.bindTooltip(`Road: ${f?.properties?.name ?? "N/A"}`);
        }}
      />
    ),

    // 4) Land Cover (DUMMY)
    taytay_landcover: (
      <GeoJSON
        data={DUMMY_LANDCOVER}
        style={() => styleLandcover}
        onEachFeature={(f, layer) => {
          layer.bindTooltip(`Land cover: ${f?.properties?.class ?? "Area"}`);
        }}
      />
    ),

    // 5) Barangay Boundaries (DUMMY)
    taytay_brgy_bounds: (
      <GeoJSON
        data={DUMMY_BRGY_BOUNDS}
        style={() => styleBrgy}
        onEachFeature={(f, layer) => {
          layer.bindTooltip(`${f?.properties?.name ?? "Boundary"}`);
        }}
      />
    ),

    // 6) Rivers / Lakes (DUMMY)
    taytay_water: (
      <GeoJSON
        data={DUMMY_WATER}
        style={(feature) =>
          feature.geometry.type === "Polygon" ? styleWaterPoly : styleWaterLine
        }
        onEachFeature={(f, layer) => {
          layer.bindTooltip(`${f?.properties?.name ?? "Waterbody"}`);
        }}
      />
    ),
  };
}

/** Basemap registry */
function createBasemapRegistry() {
  return {
    "osm-standard": (
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
        noWrap={true}
      />
    ),
    "carto-light": (
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="© OpenStreetMap contributors © CARTO"
        noWrap={true}
      />
    ),
    "carto-dark": (
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="© OpenStreetMap contributors © CARTO"
        noWrap={true}
      />
    ),
    "esri-imagery": (
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles © Esri — Sources: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        noWrap={true}
      />
    ),
    opentopo: (
      <TileLayer
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        attribution="Map data © OpenStreetMap contributors, SRTM — Map style © OpenTopoMap (CC-BY-SA)"
        noWrap={true}
      />
    ),
  };
}

/* ===============================
   Inline styles
================================= */
const styles = {
  app: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    background: "#0b1020",
  },
  sidebarWrap: {
    flex: "0 0 320px",
    maxWidth: 420,
    minWidth: 260,
    borderRight: "1px solid rgba(255,255,255,.06)",
    overflow: "auto",
  },
  mapWrap: {
    position: "relative",
    minWidth: 0,
    flex: 1,
  },
};
