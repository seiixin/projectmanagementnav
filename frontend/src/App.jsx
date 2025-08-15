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

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="parcel" element={<Parcel />} />
        <Route path="ibaan" element={<Ibaan />} />
        <Route path="alameda" element={<Alameda />} />
        <Route path="landparcel" element={<LandParcel />} />
        <Route path="landparcellist" element={<LandParcelList />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
