import React from "react";
import { Link } from "react-router-dom";
import "../styles/components/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-buttons">
        <Link to="/home" className="sidebar-button" onClick={onClose}>
          Dashboard
        </Link>
        <Link to="/upload" className="sidebar-button" onClick={onClose}>
          Upload
        </Link>
        <Link to="/scan" className="sidebar-button" onClick={onClose}>
          Scan
        </Link>
        <Link to="/settings" className="sidebar-button" onClick={onClose}>
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
