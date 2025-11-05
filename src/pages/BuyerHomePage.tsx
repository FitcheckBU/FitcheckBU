import {
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

const BuyerHomePage = () => {
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
      </IonContent>
    </IonPage>
  );
};

export default BuyerHomePage;
