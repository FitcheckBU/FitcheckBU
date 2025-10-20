import { IonButton, IonContent, IonPage } from "@ionic/react";
import "./Home.css";
import "../components/PageContent.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="page-content">
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
