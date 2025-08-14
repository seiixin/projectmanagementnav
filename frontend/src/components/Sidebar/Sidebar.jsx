import React, { useState, useEffect } from 'react';
import { Collapse } from 'react-bootstrap';
import { Link, useNavigate, useParams } from "react-router";
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768); // OPEN if desktop
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect screen resize for responsive mode
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile); // If desktop → open, if mobile → closed
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Burger Menu for Mobile - Top Right */}
      {isMobile && (
        <button
          className="burger-btn btn "
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle mobile sidebar"
          style={{ background: '#2779F5' }}
        >
          <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`Sidebar ${isMobile ? (isOpen ? 'sidebar-show' : 'sidebar-hide') : ''}`}
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          zIndex: 2000,
        }}
      >
        <div
          className="d-flex flex-column"
          style={{
            height: '100vh',
            width: isOpen ? '300px' : isMobile ? '300px' : '60px',
            transition: 'width 0.3s',
          }}
        >
          {/* Desktop Toggle Button */}
          {!isMobile && (
            <button
              className="btn btn-outline-secondary m-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle sidebar"
            >
              <i className={`bi ${isOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
            </button>
          )}

          {/* Navigation */}
          <nav className="nav flex-column">
          
            <Link to="/" className="nav-link">
              <i className="bi bi-house me-2"></i>
              {isOpen && 'Home'}
            </Link>
            <Link to="/parcel" className="nav-link">
              <i className="bi bi-backpack3 me-2"></i>
              {isOpen && 'Parcel'}
            </Link>


            <button
              className="nav-link btn btn-link text-start"
              onClick={() => setSubmenuOpen(!submenuOpen)}
              aria-expanded={submenuOpen}
              aria-controls="submenu"
            >
              <i className="bi bi-folder me-2"></i>
              {isOpen && 'Projects'}
              <i className={`bi ms-auto ${submenuOpen ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`}></i>
            </button>

            <Collapse in={submenuOpen}>
              <div id="submenu" className="ms-4">
                <a className="nav-link" href="#proj1">Project 1</a>
                <a className="nav-link" href="#proj2">Project 2</a>
                <a className="nav-link" href="#proj3">Project 3</a>
              </div>
            </Collapse>

            <a className="nav-link" href="#settings">
              <i className="bi bi-gear me-2"></i>
              {isOpen && 'Settings'}
            </a>
            <a className="nav-link mt-auto" href="#logout">
              <i className="bi bi-box-arrow-right me-2"></i>
              {isOpen && 'Logout'}
            </a>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
