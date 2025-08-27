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

  // open Projects submenu if current route is inside it
  const routeInProjects = /^(\/(landparcellist|taxlist|buildinglist|logs|surveyreturns))/.test(
    location.pathname
  );
  const [submenuOpen, setSubmenuOpen] = useState(routeInProjects);

  useEffect(() => {
    setSubmenuOpen(routeInProjects);
  }, [routeInProjects]);

  useEffect(() => {
    const onResize = () => {
      const mobile = isSmallScreen();
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
            <NavLink to="/" className={navClass} onClick={onNavigate()}>
              <i className="bi bi-house me-2" />
              {isOpen && "Home"}
            </NavLink>

            <NavLink to="/parcel" className={navClass} onClick={onNavigate("/parcel")}>
              <i className="bi bi-backpack3 me-2" />
              {isOpen && "Parcel"}
            </NavLink>

            {/* Projects parent */}
            <button
              className="nav-link btn btn-link text-start d-flex align-items-center"
              onClick={() => setSubmenuOpen((s) => !s)}
              aria-expanded={submenuOpen}
              aria-controls="submenu-projects"
            >
              <i className="bi bi-folder me-2" />
              {isOpen && <span className="flex-grow-1">Projects</span>}
              {isOpen && (
                <i className={`bi ms-auto ${submenuOpen ? "bi-caret-up-fill" : "bi-caret-down-fill"}`} />
              )}
            </button>

            {/* Projects submenu */}
            <Collapse in={submenuOpen}>
              <div id="submenu-projects" className="ms-4">
                <NavLink
                  to="/landparcellist"
                  className={navClass}
                  onClick={onNavigate("/landparcellist")}
                >
                  {isOpen && "Land Parcels"}
                  {!isOpen && <i className="bi bi-geo" />}
                </NavLink>

                <NavLink to="/taxlist" className={navClass} onClick={onNavigate("/taxlist")}>
                  {isOpen && "Tax Forms"}
                  {!isOpen && <i className="bi bi-receipt" />}
                </NavLink>

                <NavLink
                  to="/buildinglist"
                  className={navClass}
                  onClick={onNavigate("/buildinglist")}
                >
                  {isOpen && "Buildings"}
                  {!isOpen && <i className="bi bi-building" />}
                </NavLink>

                {/* ✅ NEW: Survey Returns (placeholder) */}
                <NavLink
                  to="/surveyreturns"
                  className={navClass}
                  onClick={onNavigate("/surveyreturns")}
                >
                  {isOpen && (
                    <span className="d-flex align-items-center">
                      Survey Returns
                    </span>
                  )}
                  {!isOpen && <i className="bi bi-journal-text" />}
                </NavLink>

                {/* Logs */}
                <NavLink to="/logs" className={navClass} onClick={onNavigate("/logs")}>
                  {isOpen && "Logs"}
                  {!isOpen && <i className="bi bi-clipboard-data" />}
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
