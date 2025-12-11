import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "../styles/pages/BuyerSettingsPage.css";

const BuyerSettingsPage: React.FC = () => {
  const history = useHistory();

  const handleLogOut = () => {
    console.log("Log out clicked");
    // Add your logout logic here
  };

  const handlePrivacyPolicy = () => {
    console.log("Privacy Policy clicked");
    // Navigate to privacy policy
  };

  const handleDeleteAccount = () => {
    console.log("Delete Account clicked");
    // Add delete account logic
  };

  const handleTermsOfUse = () => {
    console.log("Terms of Use clicked");
    // Navigate to terms of use
  };

  const handleEdit = () => {
    console.log("Edit clicked");
    // Add edit profile logic
  };

  const handleBack = () => {
    history.goBack();
  };

  return (
    <IonPage className="buyer-settings-page">
      <IonContent className="buyer-settings-content">
        {/* Green Header matching BuyerDashboard */}
        <div className="buyer-settings-header">
          <IonIcon
            icon={arrowBackOutline}
            className="buyer-settings-back-icon"
            onClick={handleBack}
            data-testid="button-back"
          />
          <h1 className="buyer-settings-title">Profile</h1>
        </div>

        <div className="buyer-settings-container">
          <div className="buyer-settings-card">
            {/* Profile Section */}
            <div className="buyer-profile-section">
              <img
                src="public/profileplaceholder.png"
                alt="Profile"
                className="buyer-profile-image"
                data-testid="img-profile"
              />
              <div className="buyer-profile-info">
                <h2 className="buyer-profile-name">Buyer Name</h2>
                <p className="buyer-profile-detail">buyer@email.com</p>
                <p className="buyer-profile-detail">508-592-1840</p>
                <p className="buyer-profile-detail">12/3/2002</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="buyer-settings-actions">
              <button
                className="buyer-settings-button"
                onClick={handlePrivacyPolicy}
                data-testid="button-privacy-policy"
              >
                Privacy Policy
              </button>
              <button
                className="buyer-settings-button"
                onClick={handleDeleteAccount}
                data-testid="button-delete-account"
              >
                Delete Account
              </button>
              <button
                className="buyer-settings-button"
                onClick={handleTermsOfUse}
                data-testid="button-terms-of-use"
              >
                Terms of Use
              </button>
              <button
                className="buyer-settings-button"
                onClick={handleLogOut}
                data-testid="button-log-out"
              >
                Log Out
              </button>
            </div>

            {/* Footer with Edit button */}
            <div className="buyer-settings-footer">
              <button
                className="buyer-settings-edit-button"
                onClick={handleEdit}
                data-testid="button-edit"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BuyerSettingsPage;
