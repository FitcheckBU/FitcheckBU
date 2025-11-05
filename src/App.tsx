import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import CameraPage from "./pages/CameraPage";
import { PhotoProvider } from "./context/PhotoContext";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import UploadFlow from "./pages/UploadFlowPage";
import ItemConfirmationPage from "./pages/ItemConfirmationPage";
import MainLayout from "./components/MainLayout";
import EmailAuthPage from "./pages/EmailAuthPage";
import { UserProvider, useUser } from "./context/UserContext";

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

  return (
    <IonRouterOutlet id="main">
      <Route
        exact
        path="/sign-in"
        render={() => (user ? <Redirect to="/home" /> : <EmailAuthPage />)}
      />
      <Route
        exact
        path="/home"
        render={() =>
          user ? (
            <MainLayout>
              <Dashboard />
            </MainLayout>
          ) : (
            <Redirect to="/sign-in" />
          )
        }
      />
      <Route
        exact
        path="/upload"
        render={() =>
          user ? (
            <MainLayout>
              <Upload />
            </MainLayout>
          ) : (
            <Redirect to="/sign-in" />
          )
        }
      />
      <Route
        exact
        path="/upload-flow"
        render={() =>
          user ? (
            <MainLayout>
              <UploadFlow />
            </MainLayout>
          ) : (
            <Redirect to="/sign-in" />
          )
        }
      />
      <Route
        exact
        path="/item-confirmation/:itemId"
        render={() =>
          user ? (
            <MainLayout>
              <ItemConfirmationPage />
            </MainLayout>
          ) : (
            <Redirect to="/sign-in" />
          )
        }
      />
      <Route exact path="/camera">
        {user ? <CameraPage /> : <Redirect to="/sign-in" />}
      </Route>
      <Route exact path="/">
        <Redirect to={user ? "/home" : "/sign-in"} />
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
