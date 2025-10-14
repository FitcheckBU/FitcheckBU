import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>FitCheck</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">FitCheck</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="home-actions">
          <IonButton expand="block" routerLink="/upload" color="primary">
            Go to Upload
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
