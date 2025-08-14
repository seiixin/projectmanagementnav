// DashboardLayout.js
import React from 'react';
import Sidebar from '../Sidebar/Sidebar.jsx';
import DashboardContent from '../Dashboard/Dashboard.jsx';
import Header from '../Header/Header.jsx';


const DashboardLayout = ({ children }) => {
  return (
    <div className="d-flex">
      <Header />
      <Sidebar />
      <main className="flex-grow-1 p-4 bg-white" style={{ height: '100vh', overflowY: 'auto', marginTop: '60px'}}>
        { children }
      </main>
    </div>
  );
};

export default DashboardLayout;
