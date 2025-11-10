import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import CameraPage from "./pages/CameraPage";
import ScanCameraPage from "./pages/ScanCameraPage";
import { PhotoProvider } from "./context/PhotoContext";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import UploadFlow from "./pages/UploadFlowPage";
import ItemConfirmationPage from "./pages/ItemConfirmationPage";
import MainLayout from "./components/MainLayout";
import EmailAuthPage from "./pages/EmailAuthPage";
import { UserProvider, useUser } from "./context/UserContext";
import BuyerHomePage from "./pages/BuyerHomePage";
import ScanFlowPage from "./pages/ScanFlowPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import ScanItemDetailPage from "./pages/ScanItemDetailPage";
import SettingsPage from "./pages/SettingsPage";
import SortFilterPage from "./pages/SortFilterPage";

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

/* Theme variables */
import "./theme/variables.css";

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { user } = useUser();
  const authedLanding = user?.user_type === "buyer" ? "/buyer" : "/home";

  const renderSeller = (element: React.ReactElement) =>
    user && user.user_type === "seller" ? (
      element
    ) : (
      <Redirect to={user ? authedLanding : "/sign-in"} />
    );

  return (
    <IonRouterOutlet id="main">
      <Route
        exact
        path="/sign-in"
        render={() =>
          user ? <Redirect to={authedLanding} /> : <EmailAuthPage />
        }
      />

      <Route
        exact
        path="/home"
        render={() =>
          renderSeller(
            <MainLayout>
              <Dashboard />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/buyer"
        render={() => {
          if (!user) {
            return <Redirect to="/sign-in" />;
          }
          return user.user_type === "buyer" ? (
            <BuyerHomePage />
          ) : (
            <Redirect to="/home" />
          );
        }}
      />

      <Route
        exact
        path="/sort-filter"
        render={() =>
          renderSeller(
            <MainLayout>
              <SortFilterPage />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/upload"
        render={() =>
          renderSeller(
            <MainLayout>
              <Upload />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/upload-flow"
        render={() =>
          renderSeller(
            <MainLayout>
              <UploadFlow />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/scan"
        render={() =>
          renderSeller(
            <MainLayout>
              <Scan />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/scan-flow"
        render={() =>
          renderSeller(
            <MainLayout>
              <ScanFlowPage />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/item-confirmation/:itemId"
        render={() =>
          renderSeller(
            <MainLayout>
              <ItemConfirmationPage />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/item/:itemId"
        render={() =>
          renderSeller(
            <MainLayout>
              <ItemDetailPage />
            </MainLayout>,
          )
        }
      />

      <Route
        exact
        path="/settings"
        render={() =>
          renderSeller(
            <MainLayout>
              <SettingsPage />
            </MainLayout>,
          )
        }
      />

      <Route exact path="/camera" render={() => renderSeller(<CameraPage />)} />

      <Route
        exact
        path="/scan-camera"
        render={() => renderSeller(<ScanCameraPage />)}
      />

      <Route
        exact
        path="/"
        render={() => <Redirect to={user ? authedLanding : "/sign-in"} />}
      />
    </IonRouterOutlet>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <UserProvider>
        <PhotoProvider>
          <IonReactRouter>
            <AppRoutes />
          </IonReactRouter>
        </PhotoProvider>
      </UserProvider>
    </IonApp>
  );
};

export default App;
