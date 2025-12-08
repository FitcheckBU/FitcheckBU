import { IonButton, IonIcon } from "@ionic/react";
import { menuOutline } from "ionicons/icons";
import "./TopNavBar.css";

interface TopNavBarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onMenuClick,
}) => {
  return (
      <Logo variant="default" />
      <IonButton 
        fill="clear" 
        className="top-navbar-menu-button"
        onClick={onMenuClick}
        data-testid="button-menu"
      >
        <IonIcon icon={menuOutline} slot="icon-only" />
      </IonButton>
    </div>
  );
};

export default TopNavBar;
