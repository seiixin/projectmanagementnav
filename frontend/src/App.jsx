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

function App() {
  const isLoggedIn = true;
  let routes = "";
  if (isLoggedIn) {
    routes = (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parcel" element={<Parcel />} />
          <Route path="/ibaan" element={<Ibaan />} />
          <Route path="/alameda" element={<Alameda />} />
        </Routes>
      </Layout>
    );
  } else {
    routes = (
      <Routes>
        <Route path="/" element={<LoginPage />} />
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
