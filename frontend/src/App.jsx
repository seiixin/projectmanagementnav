import { useState } from 'react'
import { Route, Routes } from 'react-router'
import './App.css'
import LoginPage from './components/Login/Login.jsx';
import SignupPage from './components/Signup/Signup.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from './components/Layout/Layout.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import Parcel from './components/Parcel/Parcel.jsx';
import Ibaan from './components/Ibaan/Ibaan.jsx';
import Alameda from './components/Alameda/Alameda.jsx';
import LandParcel from './components/LandParcel/LandParcel.jsx';
import LandParcelList from './components/LandParcelList/LandParcelList.jsx';

function App() {
  let token = localStorage.getItem("token");

  const isLoggedIn = token && token !== "undefined" && token.trim() !== "";
  console.log(isLoggedIn)
  let routes = "";
  if (isLoggedIn) {
    routes = (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/parcel" element={<Parcel />} />
          <Route path="/ibaan" element={<Ibaan />} />
          <Route path="/alameda" element={<Alameda />} />
          <Route path="/landparcel" element={<LandParcel />} />
          <Route path="/landparcellist" element={<LandParcelList />} />
        </Routes>
      </Layout>
    );
  } else {
    routes = (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    );
  }
  return (
    <>
      {routes}
    </>
  )
}

export default App
