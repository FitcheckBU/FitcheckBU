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
import ItemConfirmationPage from "./pages/ItemConfirmationPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import SettingsPage from "./pages/SettingsPage";
import MainLayout from "./components/MainLayout";
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

const AppRoutes = () => {
  const { user } = useUser();
  const authedLanding = user?.user_type === "buyer" ? "/buyer" : "/home";

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
          user && user.user_type === "seller" ? (
            <MainLayout>
              <Dashboard />
            </MainLayout>
          ) : (
            <Redirect to={user ? authedLanding : "/sign-in"} />
          )
        }
      />
      <Route
        exact
        path="/buyer"
        render={() =>
          user ? (
            user.user_type === "buyer" ? (
              <BuyerHomePage />
            ) : (
    <IonApp>
      <PhotoProvider>
        <IonReactRouter>
          <IonRouterOutlet id="main">
            <Route
              exact
              path="/home"
              render={() => (
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/sort-filter"
              render={() => (
                <MainLayout>
                  <SortFilterPage />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/upload"
              render={() => (
                <MainLayout>
                  <Upload />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/upload-flow"
              render={() => (
                <MainLayout>
                  <UploadFlow />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/scan"
              render={() => (
                <MainLayout>
                  <Scan />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/scan-flow"
              render={() => (
                <MainLayout>
                  <ScanFlowPage />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/item-confirmation/:itemId"
              render={() => (
                <MainLayout>
                  <ItemConfirmationPage />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/item/:itemId"
              render={() => (
                <MainLayout>
                  <ItemDetailPage />
                </MainLayout>
              )}
            />
            <Route
              exact
              path="/settings"
              render={() => (
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              )}
            />
            <Route exact path="/camera">
              <CameraPage />
            </Route>
            <Route exact path="/scan-camera">
              <ScanCameraPage />
            </Route>
            <Route exact path="/">
              <Redirect to="/home" />
            )
          ) : (
            <Redirect to="/sign-in" />
          )
        }
      />
      <Route
        exact
        path="/upload"
        render={() =>
          user && user.user_type === "seller" ? (
            <MainLayout>
              <Upload />
            </MainLayout>
          ) : (
            <Redirect to={user ? authedLanding : "/sign-in"} />
          )
        }
      />
      <Route
        exact
        path="/upload-flow"
        render={() =>
          user && user.user_type === "seller" ? (
            <MainLayout>
              <UploadFlow />
            </MainLayout>
          ) : (
            <Redirect to={user ? authedLanding : "/sign-in"} />
          )
        }
      />
      <Route
        exact
        path="/item-confirmation/:itemId"
        render={() =>
          user && user.user_type === "seller" ? (
            <MainLayout>
              <ItemConfirmationPage />
            </MainLayout>
          ) : (
            <Redirect to={user ? authedLanding : "/sign-in"} />
          )
        }
      />
      <Route exact path="/camera">
        {user && user.user_type === "seller" ? (
          <CameraPage />
        ) : (
          <Redirect to={user ? authedLanding : "/sign-in"} />
        )}
      </Route>
      <Route exact path="/">
        <Redirect to={user ? authedLanding : "/sign-in"} />
      </Route>
    </IonRouterOutlet>
  );
};

const App = () => {
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
