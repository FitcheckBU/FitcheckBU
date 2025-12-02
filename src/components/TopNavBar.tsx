import { IonButton, IonButtons, IonToolbar } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "./TopNavBar.css";

interface TopNavBarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onMenuClick,
  isSidebarOpen,
}) => {
  const history = useHistory();
  const { user, signOut } = useUser();

  const goHome = () => {
    history.push(user?.user_type === "buyer" ? "/buyer" : "/home");
  };

  const handleSignOut = () => {
    signOut();
    history.replace("/sign-in");
  };

  return (
    <div className="top-navbar">
      <IonToolbar color="primary">
        <img
          src="/FitcheckNest.svg"
          alt="Logo"
          className="navbar-logo"
          onClick={goHome}
        />
        <IonButtons slot="end">
          {user && (
            <IonButton
              className="navbar-signout"
              color="light"
              fill="outline"
              onClick={handleSignOut}
            >
              Sign out
            </IonButton>
          )}
          <IonButton onClick={onMenuClick} color="primary">
            <img
              src={isSidebarOpen ? "/close.svg" : "/hamburger.svg"}
              alt={isSidebarOpen ? "Close" : "Menu"}
              className="navbar-hamburger"
            />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </div>
  );
};

export default TopNavBar;
