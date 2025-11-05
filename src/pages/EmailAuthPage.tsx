import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  createBuyerProfile,
  createSellerProfile,
  createStore,
  createUser,
  findUserProfileByEmail,
  type UserType,
} from "../lib/userService";
import { useUser } from "../context/UserContext";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type Stage = "email" | "register";

interface RegistrationState {
  name: string;
  age: string;
  userType: UserType;
  buyerLocation: string;
  storeLocation: string;
}

const initialRegistration: RegistrationState = {
  name: "",
  age: "",
  userType: "buyer",
  buyerLocation: "",
  storeLocation: "",
};

const EmailAuthPage = () => {
  const history = useHistory();
  const { user, setUser } = useUser();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [registration, setRegistration] =
    useState<RegistrationState>(initialRegistration);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      history.replace("/home");
    }
  }, [history, user]);

  const handleEmailSubmit = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await findUserProfileByEmail(normalized);
      if (!profile) {
        setRegistration(initialRegistration);
        setStage("register");
        return;
      }

      const buyerLocation = profile.buyer?.location;
      const sellerStore = profile.seller?.store;

      setUser({
        ...profile.user,
        buyerLocation,
        store: sellerStore,
      });
      history.replace("/home");
    } catch (lookupError) {
      console.error("Failed to look up user:", lookupError);
      setError("Could not verify your email right now. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationChange = (
    field: keyof RegistrationState,
    value: string,
  ) => {
    setRegistration((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (registration.name.trim().length === 0) {
      setError("Name is required.");
      return;
    }

    const ageNumber = Number.parseInt(registration.age, 10);
    if (Number.isNaN(ageNumber) || ageNumber <= 0) {
      setError("Please provide a valid age.");
      return;
    }

    if (
      registration.userType === "buyer" &&
      registration.buyerLocation.trim().length === 0
    ) {
      setError("Buyer location is required.");
      return;
    }

    if (
      registration.userType === "seller" &&
      registration.storeLocation.trim().length === 0
    ) {
      setError("Store location is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newUser = await createUser({
        email: normalized,
        name: registration.name.trim(),
        age: ageNumber,
        user_type: registration.userType,
      });

      if (registration.userType === "buyer") {
        const location = registration.buyerLocation.trim();
        await createBuyerProfile(newUser.id, location);
        setUser({
          ...newUser,
          buyerLocation: location,
        });
      } else {
        const location = registration.storeLocation.trim();
        const storeRef = await createStore(location);
        await createSellerProfile(newUser.id, storeRef);
        setUser({
          ...newUser,
          store: {
            id: storeRef.id,
            location,
          },
        });
      }

      setRegistration(initialRegistration);
      setStage("email");
      history.replace("/home");
    } catch (registrationError) {
      console.error("Failed to register user:", registrationError);
      setError("Could not register right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign In With Email</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonInput
              label="Email"
              aria-label="Email"
              type="email"
              value={email}
              onIonChange={(event) => setEmail(event.detail.value ?? "")}
              clearInput
              inputMode="email"
            />
          </IonItem>
          {stage === "email" && (
            <IonButton expand="block" onClick={handleEmailSubmit}>
              Continue
            </IonButton>
          )}
        </IonList>

        {stage === "register" && (
          <IonList data-testid="registration-form">
            <IonItem>
              <IonInput
                label="Full Name"
                aria-label="Full Name"
                value={registration.name}
                onIonChange={(event) =>
                  handleRegistrationChange("name", event.detail.value ?? "")
                }
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Age"
                aria-label="Age"
                type="number"
                value={registration.age}
                onIonChange={(event) =>
                  handleRegistrationChange("age", event.detail.value ?? "")
                }
              />
            </IonItem>
            <IonItem lines="full">
              <IonLabel>User Type</IonLabel>
            </IonItem>
            <IonRadioGroup
              value={registration.userType}
              onIonChange={(event) =>
                handleRegistrationChange(
                  "userType",
                  event.detail.value as UserType,
                )
              }
            >
              <IonItem>
                <IonLabel>Buyer</IonLabel>
                <IonRadio value="buyer" aria-label="Buyer" />
              </IonItem>
              <IonItem>
                <IonLabel>Seller</IonLabel>
                <IonRadio value="seller" aria-label="Seller" />
              </IonItem>
            </IonRadioGroup>

            {registration.userType === "buyer" && (
              <IonItem>
                <IonInput
                  label="Buyer Location"
                  aria-label="Buyer Location"
                  value={registration.buyerLocation}
                  onIonChange={(event) =>
                    handleRegistrationChange(
                      "buyerLocation",
                      event.detail.value ?? "",
                    )
                  }
                />
              </IonItem>
            )}

            {registration.userType === "seller" && (
              <IonItem>
                <IonInput
                  label="Store Location"
                  aria-label="Store Location"
                  value={registration.storeLocation}
                  onIonChange={(event) =>
                    handleRegistrationChange(
                      "storeLocation",
                      event.detail.value ?? "",
                    )
                  }
                />
              </IonItem>
            )}

            <IonButton expand="block" onClick={handleRegister}>
              Register
            </IonButton>
          </IonList>
        )}

        {loading && (
          <div className="ion-text-center" data-testid="loading">
            <IonSpinner />
          </div>
        )}

        {error && (
          <IonText color="danger" data-testid="error-message">
            <p>{error}</p>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default EmailAuthPage;
