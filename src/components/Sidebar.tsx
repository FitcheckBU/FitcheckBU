import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button onClick={onClose} className="close-button">
        <img src="/Close.png" alt="Close" />
      </button>
      <nav>
        <ul>
          <li>
            <Link to="/upload" onClick={onClose}>
              Upload Page
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
