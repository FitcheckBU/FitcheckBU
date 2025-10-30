import { useState } from "react";
import { IonPage, IonContent } from "@ionic/react";
import TopNavBar from "./TopNavBar";
import Sidebar from "./Sidebar";
import "./MainLayout.css";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <IonPage>
      <TopNavBar
        onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`page-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <IonContent className="page-content">{children}</IonContent>
    </IonPage>
  );
};

export default MainLayout;
