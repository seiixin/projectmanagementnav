// src/components/TaytayDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// OpenLayers
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import { fromLonLat } from "ol/proj";

// Chart.js
import {
  Chart,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
} from "chart.js";

Chart.register(
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement
);

// Change this if your maps live elsewhere
const MAPS_ROUTE = "/taytay";

export default function TaytayDashboard() {
  const navigate = useNavigate();

  // canvases & map
  const landUseCanvasRef = useRef(null);
  const householdCanvasRef = useRef(null);
  const accessCanvasRef = useRef(null);
  const mapRootRef = useRef(null);

  // chart instances
  const landUseChartRef = useRef(null);
  const householdChartRef = useRef(null);
  const accessChartRef = useRef(null);

  // map refs
  /** @type {React.MutableRefObject<Map|null>} */
  const mapRef = useRef(null);
  const baseLayersRef = useRef({});
  const floodLayerRef = useRef(null);

  // UI state
  const [floodLayerOn, setFloodLayerOn] = useState(false);
  const [baseKey, setBaseKey] = useState("osm"); // "osm" | "satellite" | "topographic"

  const header = useMemo(
    () => ({
      title: "Taytay, Palawan",
      subtitle: "Local Government Unit Dashboard",
      description:
        "A data-driven overview of key municipal information for informed decision-making and public service delivery.",
    }),
    []
  );

  // Charts
  useEffect(() => {
    // Land Use (Pie)
    if (landUseCanvasRef.current) {
      const ctx = landUseCanvasRef.current.getContext("2d");
      landUseChartRef.current?.destroy?.();
      landUseChartRef.current = new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Agricultural", "Forest/Protected", "Residential", "Commercial", "Industrial"],
          datasets: [
            {
              data: [55, 25, 15, 3, 2],
              backgroundColor: ["#4CAF50", "#2E7D32", "#FFCC80", "#FF8A65", "#9E9E9E"],
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12 } },
            tooltip: { callbacks: { label: (c) => `${c.label || ""}: ${c.parsed || 0}%` } },
          },
        },
      });
    }

    // Household Distribution (Bar)
    if (householdCanvasRef.current) {
      const ctx = householdCanvasRef.current.getContext("2d");
      householdChartRef.current?.destroy?.();
      householdChartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Brgy. 1","Brgy. 2","Brgy. 3","Brgy. 4","Brgy. 5","Brgy. 6","Brgy. 7","Brgy. 8"],
          datasets: [
            {
              label: "Number of Households",
              data: [1200, 850, 950, 1100, 700, 1300, 600, 1050],
              backgroundColor: "#4CAF50",
              borderColor: "#2E7D32",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    // Access to Basic Services (Bar)
    if (accessCanvasRef.current) {
      const ctx = accessCanvasRef.current.getContext("2d");
      accessChartRef.current?.destroy?.();
      accessChartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Brgy. 1","Brgy. 2","Brgy. 3","Brgy. 4","Brgy. 5","Brgy. 6","Brgy. 7","Brgy. 8"],
          datasets: [
            {
              label: "Access to Safe Water (%)",
              data: [85, 75, 90, 80, 70, 95, 65, 88],
              backgroundColor: "#3b82f6",
              borderColor: "#1e40af",
              borderWidth: 1,
            },
            {
              label: "Access to Electricity (%)",
              data: [95, 80, 98, 90, 85, 99, 75, 92],
              backgroundColor: "#f59e0b",
              borderColor: "#b45309",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
          scales: {
            x: { stacked: false },
            y: { beginAtZero: true, stacked: false, ticks: { callback: (v) => `${v}%` } },
          },
        },
      });
    }

    return () => {
      landUseChartRef.current?.destroy?.();
      householdChartRef.current?.destroy?.();
      accessChartRef.current?.destroy?.();
    };
  }, []);

  // Map
  useEffect(() => {
    if (!mapRootRef.current) return;

    const osm = new TileLayer({
      source: new OSM(),
      visible: true,
      properties: { key: "osm", title: "Default Map", type: "base" },
    });

    const satellite = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attributions:
          "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }),
      visible: false,
      properties: { key: "satellite", title: "Satellite View", type: "base" },
    });

    const topographic = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attributions:
          "Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
      }),
      visible: false,
      properties: { key: "topographic", title: "Topographic Map", type: "base" },
    });

    const floodLayer = new TileLayer({
      source: new TileWMS({
        url: "https://geoserver.noah.up.edu.ph/geoserver/wms?",
        params: {
          LAYERS: "noah:Flood_Hazard_2016_v2",
          FORMAT: "image/png",
          VERSION: "1.1.1",
          TRANSPARENT: true,
        },
        crossOrigin: "anonymous",
        serverType: "geoserver",
      }),
      visible: false,
      opacity: 0.5,
      properties: { title: "NOAH Flood Hazard Layer" },
    });

    baseLayersRef.current = { osm, satellite, topographic };
    floodLayerRef.current = floodLayer;

    const taytayCenter = fromLonLat([119.5, 10.82]);

    const map = new Map({
      target: mapRootRef.current,
      layers: [osm, satellite, topographic, floodLayer],
      view: new View({ center: taytayCenter, zoom: 11 }),
    });

    mapRef.current = map;

    return () => {
      map.setTarget(null);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layers = baseLayersRef.current;
    Object.entries(layers).forEach(([k, layer]) => layer.setVisible(k === baseKey));
  }, [baseKey]);

  useEffect(() => {
    if (floodLayerRef.current) floodLayerRef.current.setVisible(floodLayerOn);
  }, [floodLayerOn]);

  return (
    <div className="tdb-root">
      {/* Inline CSS */}
      <style>{css}</style>

      {/* Hero */}
      <div className="tdb-hero">
        <div className="tdb-container tdb-hero-inner">
          <div className="tdb-hero-text">
            <h1 className="tdb-title">{header.title}</h1>
            <p className="tdb-subtitle">{header.subtitle}</p>
            <p className="tdb-desc">{header.description}</p>
          </div>

          <div className="tdb-hero-cta">
            <button
              className="tdb-btn tdb-btn-primary"
              onClick={() => navigate(MAPS_ROUTE)}
              title="Open interactive maps"
            >
              <svg className="tdb-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 21l4-2 4 2 4-2V5l-4 2-4-2-4 2-4-2v14l4 2z" fill="currentColor" />
                <path d="M12 7v12" stroke="#fff" strokeWidth="2" />
              </svg>
              Go to Maps
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tdb-container tdb-content">
        {/* Land & Property */}
        <section className="tdb-card">
          <div className="tdb-card-head">
            <h2 className="tdb-h2">Land and Property Management</h2>
          </div>

          <div className="tdb-grid tdb-grid-3">
            <DataPoint value="22,500" label="Documented Land Parcels" />
            <DataPoint value="65%" label="Parcels with Updated Tax Records" />
            <DataPoint value="1,450" label="Verified Building Footprints" />
          </div>

          <div className="tdb-block">
            <h3 className="tdb-h3">Land Use Distribution</h3>
            <div className="tdb-chart-wrap">
              <div className="tdb-chart-box">
                <canvas ref={landUseCanvasRef} />
              </div>
            </div>
            <p className="tdb-note">
              Allocation of land for residential, commercial, agricultural, and protected areas to
              guide planning and ensure compliance.
            </p>
          </div>

          <div className="tdb-block">
            <h3 className="tdb-h3">Taytay ECAN Resource Management Plan</h3>
            <div className="tdb-inline-callout">
              <p className="tdb-callout-text">
                Download the official resource management plan for Taytay, Palawan.
              </p>
              <a
                href="https://pcsd.gov.ph/wp-content/uploads/2020/12/2-Municipality-of-Taytay-ECAN-Resource-Management-Plan-2015-2020.pdf"
                className="tdb-btn tdb-btn-blue"
                download
              >
                Download PDF
              </a>
            </div>
          </div>
        </section>

        {/* DRRM & Community Resilience */}
        <section className="tdb-card">
          <div className="tdb-card-head">
            <h2 className="tdb-h2">DRRM & Community Resilience</h2>
          </div>

          <div className="tdb-grid tdb-grid-4">
            <DataPoint value="720" label="Houses in Flood-Prone Areas" />
            <DataPoint value="15" label="Designated Evacuation Centers" />
            <DataPoint value="85%" label="Early Warning System Coverage" />
            <DataPoint value="4" label="Active Fault Lines Mapped" />
          </div>

          <div className="tdb-block">
            <h3 className="tdb-h3">Flood Hazard Map</h3>

            <div className="tdb-map-shell">
              <div ref={mapRootRef} id="floodMap" className="tdb-map" aria-label="Flood Map" />
            </div>

            <div className="tdb-controls">
              <label className="tdb-checkbox">
                <input
                  type="checkbox"
                  checked={floodLayerOn}
                  onChange={(e) => setFloodLayerOn(e.target.checked)}
                />
                <span>Show Flood Hazard Layer</span>
              </label>

              <div className="tdb-select-wrap">
                <span className="tdb-select-label">Basemap:</span>
                <select
                  value={baseKey}
                  onChange={(e) => setBaseKey(e.target.value)}
                  className="tdb-select"
                >
                  <option value="osm">Default Map</option>
                  <option value="satellite">Satellite View</option>
                  <option value="topographic">Topographic Map</option>
                </select>
              </div>

              <button
                className="tdb-btn tdb-btn-primary tdb-btn-sm"
                onClick={() => navigate(MAPS_ROUTE)}
                title="Open interactive maps"
              >
                <svg className="tdb-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" fill="currentColor" />
                </svg>
                Go to Maps
              </button>
            </div>

            <div className="tdb-legend">
              <h4 className="tdb-legend-title">Flood Susceptibility Legend</h4>
              <div className="tdb-legend-items">
                <LegendItem color="#1e3a8a" label="Very High Susceptibility" />
                <LegendItem color="#1d4ed8" label="High Susceptibility" />
                <LegendItem color="#3b82f6" label="Moderate Susceptibility" />
                <LegendItem color="#93c5fd" label="Low Susceptibility" />
                <LegendItem color="#dbeafe" label="None" />
              </div>
            </div>

            <p className="tdb-note">
              This map highlights houses within flood hazard zones—critical for preparedness and
              emergency planning for residents and officials.
            </p>
          </div>
        </section>

        {/* Socio-Economic Insights */}
        <section className="tdb-card">
          <div className="tdb-card-head">
            <h2 className="tdb-h2">Socio-Economic Insights</h2>
          </div>

          <div className="tdb-grid tdb-grid-3">
            <DataPoint value="85,200" label="Total Population (2023)" />
            <DataPoint value="4.5%" label="Poverty Incidence Rate" />
            <DataPoint value="91%" label="Employment Rate" />
          </div>

          <div className="tdb-block">
            <h3 className="tdb-h3">Household Distribution by Barangay</h3>
            <div className="tdb-chart-wrap">
              <div className="tdb-chart-rect">
                <canvas ref={householdCanvasRef} />
              </div>
            </div>
            <p className="tdb-note">
              Breakdown of households across barangays based on CBMS data to guide social service
              delivery and planning.
            </p>
          </div>

          <div className="tdb-block">
            <h3 className="tdb-h3">Access to Basic Services (CBMS)</h3>
            <div className="tdb-chart-wrap">
              <div className="tdb-chart-rect">
                <canvas ref={accessCanvasRef} />
              </div>
            </div>
            <p className="tdb-note">
              Percent of households with access to safe water and electricity, per barangay.
            </p>
          </div>
        </section>

        {/* Infrastructure & Public Services */}
        <section className="tdb-card">
          <div className="tdb-card-head">
            <h2 className="tdb-h2">Infrastructure & Public Services</h2>
          </div>

          <div className="tdb-grid tdb-grid-3">
            <DataPoint value="250 km" label="Total Municipal Road Network" />
            <DataPoint value="12" label="Public Schools" />
            <DataPoint value="7" label="Health Centers" />
            <DataPoint value="1" label="Hospital" />
            <DataPoint value="18" label="Barangay Health Stations" />
          </div>
        </section>
      </div>
    </div>
  );
}

function DataPoint({ value, label }) {
  return (
    <div className="tdb-datapoint">
      <p className="tdb-dp-value">{value}</p>
      <p className="tdb-dp-label">{label}</p>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="tdb-legend-item">
      <span className="tdb-legend-swatch" style={{ backgroundColor: color }} />
      <span className="tdb-legend-text">{label}</span>
    </div>
  );
}

/* ---------- Styles (inline) ---------- */
const css = `
:root{
  --green-900:#064e3b;
  --green-800:#065f46;
  --green-700:#047857;
  --green-600:#059669;

  --blue-600:#2563eb;

  --text:#111827;
  --border:#e5e7eb;

  --card-bg:#ffffff;
  --hero-grad: linear-gradient(90deg, #16a34a22, #10b98122, #16a34a22);
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;color:var(--text);background:#f5f9f5}

.tdb-container{max-width:1200px;margin:0 auto;padding:0 24px}

/* Hero */
.tdb-hero{position:relative; overflow:hidden; background:linear-gradient(180deg,#f0fdf4,#ffffff)}
.tdb-hero::before{content:""; position:absolute; inset:0; pointer-events:none; background:var(--hero-grad); filter:blur(30px); opacity:.6}
.tdb-hero-inner{display:flex; gap:24px; align-items:flex-end; justify-content:space-between; padding:40px 0 24px}
.tdb-title{font-size:44px; line-height:1.1; margin:0; color:var(--green-900); font-weight:800}
.tdb-subtitle{font-size:20px; color:var(--green-700); margin:6px 0}
.tdb-desc{max-width:720px; color:#475569; margin:0}
.tdb-hero-cta{display:flex; align-items:center; gap:12px}

/* Buttons */
.tdb-btn{display:inline-flex; align-items:center; gap:10px; font-weight:600; border:none; cursor:pointer; border-radius:12px; transition:background .15s, transform .06s}
.tdb-btn .tdb-icon{width:20px; height:20px}
.tdb-btn-primary{background:var(--green-600); color:#fff; padding:12px 18px; box-shadow:0 6px 14px rgba(0,0,0,.15)}
.tdb-btn-primary:hover{background:#047857}
.tdb-btn-primary:active{transform:translateY(1px)}
.tdb-btn-blue{background:var(--blue-600); color:#fff; padding:10px 14px; border-radius:10px}
.tdb-btn-blue:hover{background:#1d4ed8}
.tdb-btn-sm{padding:8px 12px; border-radius:10px; font-size:14px}

/* Content wrapper */
.tdb-content{padding:24px 0 60px}

/* Cards */
.tdb-card{background:var(--card-bg); border:1px solid var(--border); border-radius:24px; box-shadow:0 8px 28px rgba(0,0,0,.06); padding:24px; margin:0 0 24px}
.tdb-card-head{display:flex; align-items:center; justify-content:space-between; padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid var(--border)}
.tdb-h2{margin:0; font-size:26px; color:var(--green-800); font-weight:800}
.tdb-h3{margin:20px 0 10px; font-size:18px; color:var(--green-800); font-weight:700}

/* Grids */
.tdb-grid{display:grid; gap:16px}
.tdb-grid-3{grid-template-columns:repeat(1,minmax(0,1fr))}
.tdb-grid-4{grid-template-columns:repeat(1,minmax(0,1fr))}
@media (min-width:768px){
  .tdb-grid-3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .tdb-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (min-width:1024px){
  .tdb-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
  .tdb-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
}

/* Datapoints */
.tdb-datapoint{display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; background:#ecfdf5; border:1px solid #ccfbf1; border-radius:16px; box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
.tdb-dp-value{font-size:34px; font-weight:800; color:#065f46; margin:0}
.tdb-dp-label{margin:6px 0 0; font-size:12px; font-weight:600; color:#475569; letter-spacing:.03em; text-transform:uppercase}

/* Blocks */
.tdb-block{margin-top:20px}
.tdb-note{font-size:13px; color:#64748b; margin-top:8px}

/* Charts */
.tdb-chart-wrap{display:flex; justify-content:center; align-items:center; min-height:260px; background:#f8fafc; border:1px solid var(--border); border-radius:16px; padding:16px}
.tdb-chart-box{width:100%; max-width:340px; height:260px; position:relative}
.tdb-chart-rect{width:100%; height:320px}

/* Inline callout */
.tdb-inline-callout{display:flex; flex-direction:column; gap:12px; align-items:flex-start; justify-content:space-between; background:#eff6ff; border:1px solid #bfdbfe; border-radius:16px; padding:16px}
.tdb-callout-text{color:#1e40af; margin:0}
@media (min-width:768px){
  .tdb-inline-callout{flex-direction:row; align-items:center}
}

/* Map */
.tdb-map-shell{background:#f8fafc; border:1px solid var(--border); border-radius:16px; overflow:hidden}
.tdb-map{width:100%; height:400px}

/* Controls row */
.tdb-controls{display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-top:12px}
.tdb-checkbox{display:inline-flex; align-items:center; gap:8px; font-size:14px; color:#374151}
.tdb-select-wrap{display:inline-flex; align-items:center; gap:8px}
.tdb-select-label{font-size:14px; color:#64748b}
.tdb-select{appearance:none; border:1px solid var(--border); border-radius:10px; padding:8px 12px; font-size:14px; background:#fff}

/* Legend */
.tdb-legend{margin-top:16px; background:#f8fafc; border:1px solid var(--border); border-radius:16px; padding:12px}
.tdb-legend-title{margin:0 0 8px; font-size:14px; color:#334155; font-weight:700}
.tdb-legend-items{display:flex; flex-wrap:wrap; gap:12px}
.tdb-legend-item{display:flex; align-items:center; gap:8px}
.tdb-legend-swatch{display:inline-block; width:16px; height:16px; border:1px solid #cbd5e1; border-radius:3px}
.tdb-legend-text{font-size:12px; color:#374151}
`;
