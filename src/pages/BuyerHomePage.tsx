import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useUser } from "../context/UserContext";

const BuyerHomePage = () => {
  const history = useHistory();
  const { signOut } = useUser();

  const handleSignOut = () => {
    signOut();
    history.replace("/sign-in");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buyer Preview</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <p>
            Welcome! This is a placeholder for the upcoming buyer experience.
            You&apos;ll eventually browse curated looks, favorite outfits, and
            manage reservations here.
          </p>
        </IonText>
        <IonButton expand="block" onClick={handleSignOut}>
          Sign out
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default BuyerHomePage;
