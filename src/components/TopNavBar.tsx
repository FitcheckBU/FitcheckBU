import { IonHeader, IonToolbar, IonButtons, IonMenuButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./TopNavBar.css";

export const TopNavBar: React.FC = () => {
  const history = useHistory();

  const goHome = () => {
    history.push("/home");
  };

  return (
    <IonHeader>
      <IonToolbar color="primary">
        <img
          src="/Logo.png"
          alt="Logo"
          className="navbar-logo"
          onClick={goHome}
        />
        <IonButtons slot="end">
          <IonMenuButton>
            <img src="/Hamburger.png" alt="Menu" className="navbar-hamburger" />
          </IonMenuButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default TopNavBar;
