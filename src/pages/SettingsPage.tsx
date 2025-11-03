import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./SettingsPage.css";

const SettingsPage: React.FC = () => {
  const history = useHistory();

  const handleLogOut = () => {
    console.log("Log out clicked");
  };

  const handlePrivacyPolicy = () => {
    console.log("Privacy Policy clicked");
  };

  const handleDeleteAccount = () => {
    console.log("Delete Account clicked");
  };

  const handleTermsOfUse = () => {
    console.log("Terms of Use clicked");
  };

  const handleApply = () => {
    console.log("Apply clicked");
  };

  const handleEdit = () => {
    console.log("Edit clicked");
  };

  const handleReturn = () => {
    history.goBack();
  };

  return (
    <IonPage>
      <IonContent className="settings-page-content">
        <div className="settings-container">
          <h1 className="settings-title">Settings</h1>

          <div className="settings-card">
            <div className="profile-section">
              <img
                src="https://via.placeholder.com/80/C8B4A0/C8B4A0"
                alt="Profile"
                className="profile-image"
                data-testid="img-profile"
              />
              <div className="profile-info">
                <h2 className="profile-name">Lena Holt</h2>
                <p className="profile-detail">lholt@gmail.com</p>
                <p className="profile-detail">508-592-1840</p>
                <p className="profile-detail">12/3/2002</p>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="settings-button"
                onClick={handlePrivacyPolicy}
                data-testid="button-privacy-policy"
              >
                Privacy Policy
              </button>
              <button
                className="settings-button"
                onClick={handleDeleteAccount}
                data-testid="button-delete-account"
              >
                Delete Account
              </button>
              <button
                className="settings-button"
                onClick={handleTermsOfUse}
                data-testid="button-terms-of-use"
              >
                Terms of Use
              </button>
              <button
                className="settings-button"
                onClick={handleLogOut}
                data-testid="button-log-out"
              >
                Log Out
              </button>
            </div>

            <div className="settings-footer">
              <button
                className="settings-apply-button"
                onClick={handleApply}
                data-testid="button-apply-settings"
              >
                Apply
              </button>
              <div className="settings-footer-row">
                <button
                  className="settings-secondary-button"
                  onClick={handleEdit}
                  data-testid="button-edit-settings"
                >
                  Edit
                </button>
                <button
                  className="settings-secondary-button"
                  onClick={handleReturn}
                  data-testid="button-return"
                >
                  Return
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
