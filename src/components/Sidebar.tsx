import React from "react";
import { Link } from "react-router-dom";
import { IonButton } from "@ionic/react";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <IonButton onClick={onClose} className="close-button" color="primary">
        <img src="/close.svg" alt="Close" />
      </IonButton>
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
