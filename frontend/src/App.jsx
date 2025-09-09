// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './components/Login/Login';
import SignupPage from './components/Signup/Signup';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Parcel from './components/Parcel/Parcel';
import Ibaan from './components/Ibaan/Ibaan';
import Alameda from './components/Alameda/Alameda';
import LandParcel from './components/LandParcel/LandParcel';
import LandParcelList from './components/LandParcelList/LandParcelList';
import Building from './components/Building/Building';
import BuildingList from './components/BuildingList/BuildingList';
import TaxForm from './components/TaxForm/TaxForm';
import TaxList from './components/TaxList/TaxList';
import SurveyReturns from "./SurveyReturns/SurveyReturns.jsx";
import Geoportal from './components/Geoportal/Geoportal';
import GeoportalLogin from "./components/Geoportal/Login/Login.jsx";
import Taytay from './components/Taytay/Taytay';
import TaytayDashboard from './components/Taytay/Dashboard.jsx';
import MapPage from './components/Map/MapPage';
import Logs from './components/logs/logs';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token && token.trim() !== '' && token !== 'undefined'
    ? children
    : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
   
      <Route path="/geoportal/login" element={<GeoportalLogin />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Home dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Static pages */}
        <Route path="parcel" element={<Parcel />} />
        <Route path="ibaan" element={<Ibaan />} />
        <Route path="alameda" element={<Alameda />} />
        <Route path="landparcel" element={<LandParcel />} />
        <Route path="landparcellist" element={<LandParcelList />} />
        <Route path="building" element={<Building />} />
        <Route path="buildinglist" element={<BuildingList />} />
        <Route path="taxform" element={<TaxForm />} />
        <Route path="taxlist" element={<TaxList />} />

        {/* 🔎 Logs page */}
        <Route path="logs" element={<Logs />} />

        <Route path="/surveyreturns" element={<SurveyReturns />} />

        {/* Deep-link map routes */}
        <Route path="map" element={<MapPage />} />
        <Route path="map/:parcelId" element={<MapPage />} />

        {/* Keep LAST: deep-link by ParcelId, e.g. /171202 */}
        <Route path=":parcelId" element={<MapPage />} />
      </Route>

      <Route path="geoportal" element={<Geoportal />} />
      <Route path="taytay" element={<Taytay />} />
      <Route path="taytay_dashboard" element={<TaytayDashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
