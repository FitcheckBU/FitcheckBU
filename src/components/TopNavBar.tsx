import { IonToolbar, IonButtons, IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./TopNavBar.css";

interface TopNavBarProps {
  onMenuClick: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onMenuClick }) => {
  const history = useHistory();

  const goHome = () => {
    history.push("/home");
  };

  return (
    <div className="top-navbar">
      <IonToolbar color="primary">
        <img
          src="/logo.svg"
          alt="Logo"
          className="navbar-logo"
          onClick={goHome}
        />
        <IonButtons slot="end">
          <IonButton onClick={onMenuClick} color="primary">
            <img src="/hamburger.svg" alt="Menu" className="navbar-hamburger" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </div>
  );
};

export default TopNavBar;
