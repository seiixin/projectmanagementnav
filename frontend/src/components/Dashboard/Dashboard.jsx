import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup  } from "react-leaflet";
import api from '../../lib/axios.js';
import "leaflet/dist/leaflet.css";

function ShowCoordinates() {
  const [coords, setCoords] = useState(null);

  // Hook into map events
  useMapEvents({
    mousemove(e) {
      setCoords({
        lat: e.latlng.lat.toFixed(5),
        lng: e.latlng.lng.toFixed(5)
      });
    }
  });

  return coords ? (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "white",
        padding: "5px 8px",
        borderRadius: "4px",
        fontSize: "14px",
        boxShadow: "0 0 4px rgba(0,0,0,0.3)",
        zIndex: 1000
      }}
    >
      Lat: {coords.lat}, Lng: {coords.lng}
    </div>
  ) : null;
}

const DashboardContent = () => {
  const [longitude, setLongitude] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [barangay, setBarangay] = useState(null);
  useEffect(() => {
    const fetchIbaan = async () => {
      try {               
        const res = await api.get("/ibaan/171693");
        setLongitude(res.data.LongitudeI);
        setLatitude(res.data.LatitudeI);
        setBarangay(res.data.BarangayNa);
      } catch (error) {
        console.log("error fetching data")
      } 
    }
    fetchIbaan();
  },[])

    if (latitude === null || longitude === null) {
      return <p>Loading map...</p>;
    }
  return (
    <div className="DashboardContent">
      <div style={{ height: "90vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]}>
          <Popup>
            {barangay}
          </Popup>
        </Marker>
        <ShowCoordinates />
      </MapContainer>
    </div>
    </div>
  );
};

export default DashboardContent;