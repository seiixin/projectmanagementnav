// src/components/Sidebar/Sidebar.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Collapse } from "react-bootstrap";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isSmallScreen = () => window.innerWidth < 768;

  const [isMobile, setIsMobile] = useState(isSmallScreen());
  const [isOpen, setIsOpen] = useState(!isSmallScreen()); // open on desktop, closed on mobile

  // ---------- Auto-open rules based on route ----------
  const routeInProjects = /^(\/(landparcellist|taxlist|buildinglist|logs|surveyreturns))/.test(
    location.pathname
  );
  const routeInParcels = /^\/parcel(\/(list|map|import|new))?$/.test(location.pathname);
  const routeInWMS = /^\/wms(\/|$)/.test(location.pathname);

  const [submenuOpenProjects, setSubmenuOpenProjects] = useState(routeInProjects);
  const [submenuOpenParcels, setSubmenuOpenParcels] = useState(routeInParcels);
  const [submenuOpenWMS, setSubmenuOpenWMS] = useState(routeInWMS); // NEW

  useEffect(() => {
    setSubmenuOpenProjects(routeInProjects);
  }, [routeInProjects]);

  useEffect(() => {
    setSubmenuOpenParcels(routeInParcels);
  }, [routeInParcels]);

  useEffect(() => {
    setSubmenuOpenWMS(routeInWMS);
  }, [routeInWMS]);

  // ---------- Resize handling ----------
  useEffect(() => {
    const onResize = () => {
      const mobile = isSmallScreen();
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---------- Nav helpers ----------
  const onNavigate = useCallback(
    (to) => (e) => {
      if (to) navigate(to);
      if (isMobile) setIsOpen(false);
    },
    [isMobile, navigate]
  );

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location = "/";
  };

  const navClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active fw-semibold" : "");

  return (
    <>
      {/* Burger (mobile) */}
      {isMobile && (
        <button
          className="burger-btn btn"
          onClick={() => setIsOpen((s) => !s)}
          aria-label="Toggle mobile sidebar"
          style={{ background: "#2779F5" }}
        >
          <i className="bi bi-list" style={{ fontSize: "1.5rem" }} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`Sidebar ${isMobile ? (isOpen ? "sidebar-show" : "sidebar-hide") : ""}`}
        style={{ position: isMobile ? "fixed" : "relative", top: 0, left: 0, zIndex: 2000 }}
      >
        <div
          className="d-flex flex-column"
          style={{
            height: "100vh",
            width: isOpen ? "300px" : isMobile ? "300px" : "60px",
            transition: "width 0.3s",
          }}
        >
          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button
              className="btn btn-outline-secondary m-2"
              onClick={() => setIsOpen((s) => !s)}
              aria-label="Toggle sidebar"
            >
              <i className={`bi ${isOpen ? "bi-chevron-left" : "bi-chevron-right"}`} />
            </button>
          )}

          {/* Nav */}
          <nav className="nav flex-column">
            <NavLink to="/taytay_dashboard" className={navClass} onClick={onNavigate("/")}>
              <i className="bi bi-house me-2" />
              {isOpen && "Dashboard"}
            </NavLink>

            {/* ===== Parcels (Dropdown) ===== */}
            <button
              className="nav-link btn btn-link text-start d-flex align-items-center"
              onClick={() => setSubmenuOpenParcels((s) => !s)}
              aria-expanded={submenuOpenParcels}
              aria-controls="submenu-parcels"
            >
              <i className="bi bi-backpack3 me-2" />
              {isOpen && <span className="flex-grow-1">Parcels</span>}
              {isOpen && (
                <i
                  className={`bi ms-auto ${
                    submenuOpenParcels ? "bi-caret-up-fill" : "bi-caret-down-fill"
                  }`}
                />
              )}
            </button>

            <Collapse in={submenuOpenParcels}>
              <div id="submenu-parcels" className="ms-4">
            

                <NavLink
                  to="/taytay"
                  className={navClass}
                  onClick={onNavigate("/taytay") /* fixed to match 'to' */}
                >
                  {isOpen ? "Taytay" : <i className="bi bi-file-earmark-arrow-up" />}
                </NavLink>

                <NavLink
                  to="/map"
                  className={navClass}
                  onClick={onNavigate("/map") /* fixed to match 'to' */}
                >
                  {isOpen ? "Ibaan" : <i className="bi bi-file-earmark-arrow-up" />}
                </NavLink>

              </div>
            </Collapse>

            {/* ===== Web Map Services (NEW dropdown) ===== */}
            <button
              className="nav-link btn btn-link text-start d-flex align-items-center"
              onClick={() => setSubmenuOpenWMS((s) => !s)}
              aria-expanded={submenuOpenWMS}
              aria-controls="submenu-wms"
            >
              <i className="bi bi-layers me-2" />
              {isOpen && <span className="flex-grow-1">Web Map Services</span>}
              {isOpen && (
                <i
                  className={`bi ms-auto ${
                    submenuOpenWMS ? "bi-caret-up-fill" : "bi-caret-down-fill"
                  }`}
                />
              )}
            </button>

            <Collapse in={submenuOpenWMS}>
              <div id="submenu-wms" className="ms-4">
                <NavLink
                  to="/geoportal"
                  className={navClass}
                  onClick={onNavigate("/geoportal")}
                >
                  {isOpen ? "Geoportal" : <i className="bi bi-grid" />}
                </NavLink>

              </div>
            </Collapse>

            {/* ===== Projects (existing dropdown) ===== */}
            <button
              className="nav-link btn btn-link text-start d-flex align-items-center"
              onClick={() => setSubmenuOpenProjects((s) => !s)}
              aria-expanded={submenuOpenProjects}
              aria-controls="submenu-projects"
            >
              <i className="bi bi-folder me-2" />
              {isOpen && <span className="flex-grow-1">Projects</span>}
              {isOpen && (
                <i
                  className={`bi ms-auto ${
                    submenuOpenProjects ? "bi-caret-up-fill" : "bi-caret-down-fill"
                  }`}
                />
              )}
            </button>

            <Collapse in={submenuOpenProjects}>
              <div id="submenu-projects" className="ms-4">
                <NavLink
                  to="/landparcellist"
                  className={navClass}
                  onClick={onNavigate("/landparcellist")}
                >
                  {isOpen ? "Land Parcels" : <i className="bi bi-geo" />}
                </NavLink>

                <NavLink to="/taxlist" className={navClass} onClick={onNavigate("/taxlist")}>
                  {isOpen ? "Tax Forms" : <i className="bi bi-receipt" />}
                </NavLink>

                <NavLink
                  to="/buildinglist"
                  className={navClass}
                  onClick={onNavigate("/buildinglist")}
                >
                  {isOpen ? "Buildings" : <i className="bi bi-building" />}
                </NavLink>

                <NavLink
                  to="/surveyreturns"
                  className={navClass}
                  onClick={onNavigate("/surveyreturns")}
                >
                  {isOpen ? "Survey Returns" : <i className="bi bi-journal-text" />}
                </NavLink>

                <NavLink to="/logs" className={navClass} onClick={onNavigate("/logs")}>
                  {isOpen ? "Logs" : <i className="bi bi-clipboard-data" />}
                </NavLink>
              </div>
            </Collapse>

            <NavLink to="/settings" className={navClass} onClick={onNavigate("/settings")}>
              <i className="bi bi-gear me-2" />
              {isOpen && "Settings"}
            </NavLink>

            <a href="#logout" className="nav-link mt-auto" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2" />
              {isOpen && "Logout"}
            </a>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
