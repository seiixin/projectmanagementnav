// src/components/Geoportal.jsx
import React, { useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  ScaleControl,
  ZoomControl,
  useMap,
  useMapEvents,
  Polyline,
  Circle,
  Marker,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import Sidebar from "./Includes/Sidebar";
import Topbar from "./Includes/Topbar";
import Footer from "./Includes/Footer";
import Legend from "./Includes/Legend";
import DataSourcesUI from "./Includes/DataSourcesUI";
import SelectedLayersManager from "./Includes/SelectedLayersManager"; // ✅ NEW

export default function Geoportal() {
  const [selected, setSelected] = useState(new Set());
  const [layerOrder, setLayerOrder] = useState([]);         // ✅ maintain visual order
  const [layerOpacity, setLayerOpacity] = useState({});     // ✅ per-layer opacity
  const [basemapOpacity, setBasemapOpacity] = useState(1);  // ✅ basemap opacity
  const [activeBase, setActiveBase] = useState("osm-standard");

  const [activeTool, setActiveTool] = useState("none"); // "none" | "query" | "ruler" | "buffer"
  const [bufferRadius, setBufferRadius] = useState(200);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const phBounds = useMemo(
    () => [
      [8.0, 116.7],  // SW
      [19.5, 130.6], // NE
    ],
    []
  );

  const layerRegistry = useMemo(() => createLayerRegistry(), []);
  const basemapRegistry = useMemo(() => createBasemapRegistry(), []);

  const legendItems = useMemo(
    () => [
      { id: "building-info",        title: "Building Information",     color: "#f59e0b" },
      { id: "building-footprints",  title: "Building Footprints",      color: "#fbbf24" },
      { id: "roads",                title: "Road Network",             color: "#ef4444" },
      { id: "water-bodies",         title: "Water Bodies",             color: "#3b82f6" },
      { id: "dams",                 title: "Dam",                      color: "#60a5fa" },
      { id: "service-area",         title: "Irrigation Service Area",  color: "#93c5fd" },
      { id: "clup",                 title: "Municipal CLUP",           color: "#22c55e" },
      { id: "ecan",                 title: "ECAN Zone",                color: "#16a34a" },
      { id: "land-cover",           title: "Land Cover",               color: "#0ea5e9" },
      { id: "bswm-soil",            title: "BSWM (Soil Map)",          color: "#a855f7" },
      { id: "agri-registered",      title: "Agriculture: Registered",  color: "#84cc16" },
      { id: "agri-unregistered",    title: "Agriculture: Not Registered", color: "#bef264" },
      { id: "noah-earthquake",      title: "Earthquake (NOAH)",        color: "#f43f5e" },
      { id: "noah-flood",           title: "Flood (NOAH)",             color: "#06b6d4" },
      { id: "noah-volcanic",        title: "Volcanic (NOAH)",          color: "#fb7185" },
      { id: "noah-landslide",       title: "Landslide (NOAH)",         color: "#ea580c" },
      { id: "orthophoto",           title: "Orthophotography",         color: "#94a3b8" },
      { id: "topo-20k",             title: "Topographic (1:20,000)",   color: "#64748b" },
    ],
    []
  );

  // Keep Set for membership, and a separate array for rendering order.
  function toggleLayer(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLayerOrder(o => o.filter(x => x !== id));
      } else {
        next.add(id);
        setLayerOrder(o => (o.includes(id) ? o : [...o, id]));
        setLayerOpacity(op => (id in op ? op : { ...op, [id]: 0.8 })); // default opacity
      }
      return next;
    });
  }

  // Rendered list follows layerOrder but only those still selected:
  const selectedIds = useMemo(
    () => layerOrder.filter(id => selected.has(id)),
    [layerOrder, selected]
  );

  // Move a layer up/down in order
  function moveLayer(id, dir) {
    setLayerOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const arr = [...prev];
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= arr.length) return prev;
      [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
      return arr;
    });
  }

  // Remove a layer (equivalent to toggling off)
  function removeLayer(id) {
    if (!selected.has(id)) return;
    toggleLayer(id);
  }

  // Change opacity for one layer
  function setOpacity(id, value) {
    setLayerOpacity(prev => ({ ...prev, [id]: value }));
  }

  const basemapOptions = [
    { id: "osm-standard", title: "OSM Standard" },
    { id: "carto-light", title: "Carto Light" },
    { id: "carto-dark", title: "Carto Dark" },
    { id: "esri-imagery", title: "Esri World Imagery" },
    { id: "opentopo", title: "OpenTopoMap" },
  ];

  return (
    <div style={{ ...styles.root, gridTemplateColumns: sidebarOpen ? "360px 1fr" : "0px 1fr" }}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebarWrap, display: sidebarOpen ? "block" : "none" }} aria-hidden={!sidebarOpen}>
        <DataSourcesUI />
        <Sidebar
          selected={selected}
          onToggleLayer={toggleLayer}
          basemapOptions={basemapOptions}
          activeBase={activeBase}
          onChangeBase={setActiveBase}
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          bufferRadius={bufferRadius}
          onChangeBufferRadius={setBufferRadius}
          onPrint={() => window.print()}
        />
        {/* ✅ NEW: Selected Layers Manager (UI + real wiring) */}
        <SelectedLayersManager
          items={selectedIds.map((id) => ({
            id,
            title: legendItems.find(x => x.id === id)?.title || id,
            opacity: layerOpacity[id] ?? 0.8,
          }))}
          onMoveUp={(id) => moveLayer(id, "up")}
          onMoveDown={(id) => moveLayer(id, "down")}
          onOpacity={(id, v) => setOpacity(id, v)}
          onRemove={(id) => removeLayer(id)}
          basemapOpacity={basemapOpacity}
          onBasemapOpacity={setBasemapOpacity}
          activeBaseTitle={basemapOptions.find(b => b.id === activeBase)?.title || activeBase}
        />
      </div>

      {/* Right column */}
      <div style={styles.mainWrap}>
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onClear={() => {
            setSelected(new Set());
            setLayerOrder([]);
          }}
        />

        <div style={styles.mapFlex}>
          <MapContainer
            maxBounds={phBounds}
            maxBoundsViscosity={1.0}
            minZoom={5}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <FitPHOnMount bounds={phBounds} padding={[24, 24]} />
            <RefitOnSidebar trigger={sidebarOpen} bounds={phBounds} padding={[24, 24]} />

            {/* Basemap with adjustable opacity */}
            {React.cloneElement(basemapRegistry[activeBase], {
              opacity: basemapOpacity,
            })}

            {/* Overlays respecting order + opacity + zIndex */}
            {selectedIds.map((id, index) => {
              const node = layerRegistry[id];
              if (!node) return null;
              const opacity = layerOpacity[id] ?? 0.8;
              const zIndex = 400 + index; // stack in order
              return React.cloneElement(node, { key: id, opacity, zIndex });
            })}

            {/* Tools */}
            <ToolQuery enabled={activeTool === "query"} />
            <ToolRuler enabled={activeTool === "ruler"} />
            <ToolBuffer enabled={activeTool === "buffer"} radius={bufferRadius} />

            <ScaleControl position="bottomleft" />
            <ZoomControl position="bottomright" />
          </MapContainer>

          {/* Legend (read-only) */}
          <Legend items={legendItems} activeIds={selectedIds} />
        </div>

        <Footer />
      </div>
    </div>
  );
}

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

/** Refit after sidebar toggle */
function RefitOnSidebar({ trigger, bounds, padding = [20, 20] }) {
  const map = useMap();
  React.useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding });
    }, 250);
    return () => clearTimeout(t);
  }, [map, trigger, bounds, padding]);
  return null;
}

/** Query tool */
function ToolQuery({ enabled }) {
  const map = useMap();
  React.useEffect(() => {
    if (!enabled) return;
    const onClick = (e) => {
      const { lat, lng } = e.latlng;
      L.popup()
        .setLatLng(e.latlng)
        .setContent(
          `<div style="font:12px/1.3 system-ui">Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}</div>`
        )
        .openOn(map);
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      map.closePopup();
    };
  }, [map, enabled]);
  return null;
}

/** Ruler tool */
function ToolRuler({ enabled }) {
  const [pts, setPts] = React.useState([]);
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      setPts((prev) => [...prev, e.latlng]);
    },
  });

  React.useEffect(() => {
    if (!enabled) {
      setPts([]);
      return;
    }
    const onKey = (ev) => {
      if (ev.key === "Escape") setPts([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  const totalMeters = React.useMemo(() => {
    if (pts.length < 2) return 0;
    let m = 0;
    for (let i = 1; i < pts.length; i++) {
      m += map.distance(pts[i - 1], pts[i]);
    }
    return m;
  }, [pts, map]);

  if (!enabled) return null;

  return (
    <>
      {pts.length > 0 && <Polyline positions={pts} pathOptions={{ weight: 3 }} />}
      {pts.map((p, i) => (
        <Marker key={i} position={p}>
          <Tooltip permanent offset={[0, -12]}>
            {i === pts.length - 1
              ? totalMeters > 1000
                ? `${(totalMeters / 1000).toFixed(2)} km`
                : `${Math.round(totalMeters)} m`
              : `${i + 1}`}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

/** Buffer tool */
function ToolBuffer({ enabled, radius }) {
  const [center, setCenter] = React.useState(null);
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      setCenter(e.latlng);
    },
  });
  if (!enabled || !center) return null;
  return <Circle center={center} radius={Math.max(1, Number(radius) || 0)} pathOptions={{ weight: 2 }} />;
}

/** Styles */
const styles = {
  root: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    background: "#0b1020",
    transition: "grid-template-columns .2s ease",
  },
  sidebarWrap: {
    minWidth: 0,
    borderRight: "1px solid rgba(255,255,255,.06)",
    overflow: "auto",
  },
  mainWrap: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    height: "100%",
  },
  mapFlex: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
};

/** Overlay registry (replace with your services) */
function createLayerRegistry() {
  const format = "image/png";
  const transparent = true;
  return {
    "building-info": (
      <WMSTileLayer
        url="https://demo.geo-solutions.it/geoserver/wms"
        params={{ layers: "topp:states", format, transparent }}
        opacity={0.9}
      />
    ),
    "building-footprints": (
      <WMSTileLayer
        url="https://demo.geo-solutions.it/geoserver/wms"
        params={{ layers: "nurc:Img_Sample", format, transparent }}
        opacity={0.7}
      />
    ),
    // Add more overlays here, ids must match the legend + sidebar
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
        attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
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
