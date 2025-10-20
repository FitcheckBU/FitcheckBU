import { Redirect, Route } from "react-router-dom";
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact, IonPage, IonContent } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { homeOutline, cloudUploadOutline, gridOutline } from "ionicons/icons";
import Home from "./pages/Home";
// import Upload from "./pages/Upload";
import TopNavBar from "./components/TopNavBar";
import CameraPage from "./pages/CameraPage";
import { PhotoProvider } from "./context/PhotoContext";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import UploadFlow from "./pages/UploadFlowPage";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
// import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <IonApp>
      <PhotoProvider>
        <IonReactRouter>
          <IonPage>
            <TopNavBar onMenuClick={() => setSidebarOpen(true)} />
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <IonContent>
              <IonRouterOutlet id="main">
                <Route exact path="/home">
                  <Home />
                </Route>
                <Route exact path="/upload">
                  <Upload />
                </Route>
                <Route exact path="/upload-flow">
                  <UploadFlow />
                </Route>
                <Route exact path="/camera">
                  <CameraPage />
                </Route>
                <Route exact path="/dashboard">
                  <Dashboard />
                </Route>
                <Route exact path="/">
                  <Redirect to="/home" />
                </Route>
              </IonRouterOutlet>
              <IonTabBar slot="bottom">
                <IonTabButton tab="home" href="/home" data-testid="tab-home">
                  <IonIcon icon={homeOutline} />
                  <IonLabel>Home</IonLabel>
                </IonTabButton>
                <IonTabButton tab="upload" href="/upload" data-testid="tab-upload">
                  <IonIcon icon={cloudUploadOutline} />
                  <IonLabel>Upload</IonLabel>
                </IonTabButton>
                <IonTabButton tab="dashboard" href="/dashboard" data-testid="tab-dashboard">
                  <IonIcon icon={gridOutline} />
                  <IonLabel>Dashboard</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonContent>
          </IonPage>
        </IonReactRouter>
      </PhotoProvider>
    </IonApp>
  );
};

export default App;
