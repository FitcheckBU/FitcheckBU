import { IonBackButton, IonButton, IonText } from "@ionic/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import StorageUploadButton from "../components/StorageUploadButton";
import { PHOTO_STAGES, PhotoRole } from "../constants/photoStages";
import { usePhotoContext } from "../context/PhotoContext";
import "./UploadFlowPage.css";

type SelectedImage = {
  id: string;
  name: string;
  url: string;
  size: number;
  file: File;
  role: PhotoRole;
  origin: "camera" | "library";
};

type RoleSelections = Record<PhotoRole, SelectedImage | undefined>;

const createEmptyRoleSelections = (): RoleSelections =>
  PHOTO_STAGES.reduce((acc, { role }) => {
    acc[role] = undefined;
    return acc;
  }, {} as RoleSelections);

const TapToScan: React.FC<{
  onClick: () => void;
  isLibraryMode: boolean;
  nextRoleTitle?: string;
  progressLabel: string;
  disabled?: boolean;
}> = ({ onClick, isLibraryMode, nextRoleTitle, progressLabel, disabled }) => {
  const actionable = Boolean(nextRoleTitle) && !disabled;
  return (
    <div
      className={`tap-to-scan-container${actionable ? " actionable" : ""}`}
      onClick={actionable ? onClick : undefined}
    >
      <IonText color="primary" className="tap-to-scan-text">
        <p>
          {nextRoleTitle
            ? `Capture ${nextRoleTitle.toLowerCase()} photo`
            : "All required photos captured"}
        </p>
        <p>{isLibraryMode ? "Select from Library" : "Tap to Scan"}</p>
        <p className="tap-to-scan-progress">{progressLabel}</p>
      </IonText>
      <img
        src="/qr_icon.svg"
        alt={isLibraryMode ? "Select from Library" : "Scan QR Code"}
        className={`qr-icon${!actionable ? " disabled" : ""}`}
      />
    </div>
  );
};

const RoleCaptureGrid: React.FC<{
  selections: RoleSelections;
  uploading: boolean;
  onRemove: (role: PhotoRole) => void;
}> = ({ selections, uploading, onRemove }) => (
  <div className="role-grid">
    {PHOTO_STAGES.map(({ role, title, helper }) => {
      const image = selections[role];
      return (
        <div
          key={role}
          className={`role-card${image ? " role-card-filled" : ""}`}
        >
          <div className="role-card-header">
            <IonText color="primary">
              <h3>{title}</h3>
            </IonText>
            <IonText color="medium">
              <p>{helper}</p>
            </IonText>
          </div>
          {image ? (
            <>
              <img
                src={image.url}
                alt={`${title} preview`}
                className="role-card-image"
              />
              <div className="role-card-actions">
                <IonButton
                  size="small"
                  fill="outline"
                  color="medium"
                  disabled={uploading}
                  onClick={() => onRemove(role)}
                >
                  Retake
                </IonButton>
              </div>
            </>
          ) : (
            <div className="role-card-placeholder">
              <IonText color="medium">
                <p>Awaiting photo</p>
              </IonText>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const UploadFlowPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [roleSelections, setRoleSelections] = useState<RoleSelections>(() =>
    createEmptyRoleSelections(),
  );
  const [uploading, setUploading] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { photos, clearPhotos } = usePhotoContext();
  const processedPhotosCountRef = useRef(0);

  const queryParams = new URLSearchParams(location.search);
  const isLibraryMode = queryParams.get("mode") === "library";

  const cleanupSelection = (selection?: SelectedImage) => {
    if (selection?.origin === "library") {
      URL.revokeObjectURL(selection.url);
    }
  };

  const pendingRoleEntry = PHOTO_STAGES.find(
    ({ role }) => !roleSelections[role],
  );
  const capturedCount = PHOTO_STAGES.filter(({ role }) =>
    Boolean(roleSelections[role]),
  ).length;
  const progressLabel = `${capturedCount}/${PHOTO_STAGES.length} photos captured`;
  const allRolesFilled = capturedCount === PHOTO_STAGES.length;

  const remainingRoles = useMemo(
    () =>
      PHOTO_STAGES.filter(({ role }) => !roleSelections[role]).map(
        ({ role }) => role,
      ),
    [roleSelections],
  );

  const nextRolePath = useMemo(() => {
    if (remainingRoles.length === 0) return undefined;
    const params = new URLSearchParams({
      roles: remainingRoles.join(","),
    });
    return `/camera?${params.toString()}`;
  }, [remainingRoles]);

  const assignDataUrlsToRoles = (dataUrls: string[]) => {
    if (dataUrls.length === 0) return;

    setRoleSelections((current) => {
      let updated = { ...current };
      let mutated = false;

      dataUrls.forEach((dataUrl, index) => {
        const openEntry = PHOTO_STAGES.find(({ role }) => !updated[role]);
        if (!openEntry) return;

        const filename = `${openEntry.role}_photo_${Date.now()}_${index}.jpeg`;
        const byteString = atob(dataUrl.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const file = new File([ab], filename, { type: "image/jpeg" });
        updated = {
          ...updated,
          [openEntry.role]: {
            id: `${openEntry.role}-${Date.now()}`,
            name: filename,
            url: dataUrl,
            size: file.size,
            file,
            role: openEntry.role,
            origin: "camera",
          },
        };
        mutated = true;
      });

      return mutated ? updated : current;
    });
  };

  useEffect(() => {
    if (isLibraryMode) return;
    if (photos.length > processedPhotosCountRef.current) {
      const newPhotosToProcess = photos.slice(processedPhotosCountRef.current);
      assignDataUrlsToRoles(newPhotosToProcess);
      processedPhotosCountRef.current = photos.length;
    } else if (photos.length === 0) {
      processedPhotosCountRef.current = 0;
    }
  }, [photos, isLibraryMode]);

  const triggerFilePicker = () => {
    if (uploading || !pendingRoleEntry) return;
    if (isLibraryMode) {
      fileInputRef.current?.click();
    } else {
      if (nextRolePath) {
        history.push(nextRolePath);
      }
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const incomingFiles = Array.from(event.target.files);

    setRoleSelections((current) => {
      const updated = { ...current };
      let mutated = false;

      PHOTO_STAGES.filter(({ role }) => !updated[role]).forEach(
        (entry, index) => {
          const file = incomingFiles[index];
          if (!file) return;
          cleanupSelection(updated[entry.role]);
          const objectUrl = URL.createObjectURL(file);
          updated[entry.role] = {
            id: `${entry.role}-${file.name}-${Date.now()}`,
            name: file.name,
            url: objectUrl,
            size: file.size,
            file,
            role: entry.role,
            origin: "library",
          };
          mutated = true;
        },
      );

      return mutated ? updated : current;
    });

    event.target.value = "";
  };

  const clearSelection = () => {
    Object.values(roleSelections).forEach((selection) =>
      cleanupSelection(selection),
    );
    setRoleSelections(createEmptyRoleSelections());
    clearPhotos();
    processedPhotosCountRef.current = 0;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (role: PhotoRole) => {
    setRoleSelections((current) => {
      const existing = current[role];
      if (existing) {
        cleanupSelection(existing);
      }
      const updated = { ...current, [role]: undefined };
      if (Object.values(updated).every((selection) => !selection)) {
        clearPhotos();
        processedPhotosCountRef.current = 0;
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      return updated;
    });
  };

  const handleItemCreated = (itemId: string) => {
    history.push(`/item-confirmation/${itemId}`);
  };

  return (
    <div className="upload-flow-wrapper">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={handleFileSelection}
        {...(!isLibraryMode && { capture: "environment" })}
      />

      <div className="upload-page-header">
        <IonBackButton defaultHref="/upload" className="back-button" />
        {capturedCount > 0 && (
          <div className="clear-all-button-container">
            <IonButton
              color="medium"
              fill="outline"
              disabled={uploading}
              onClick={clearSelection}
            >
              Clear all
            </IonButton>
          </div>
        )}
      </div>

      {pendingRoleEntry ? (
        <div className="capture-prompt">
          <TapToScan
            onClick={triggerFilePicker}
            isLibraryMode={isLibraryMode}
            nextRoleTitle={pendingRoleEntry.title}
            progressLabel={progressLabel}
            disabled={uploading}
          />
        </div>
      ) : (
        <IonText color="success" className="capture-complete-message">
          <p>All photos captured. Review and upload below.</p>
        </IonText>
      )}

      <RoleCaptureGrid
        selections={roleSelections}
        uploading={uploading}
        onRemove={removeImage}
      />

      <StorageUploadButton
        files={PHOTO_STAGES.map(({ role }) => roleSelections[role])
          .filter((selection): selection is SelectedImage => Boolean(selection))
          .map(({ id, name, file }) => ({
            id,
            name,
            file,
          }))}
        disabled={uploading || !allRolesFilled}
        onUploadingChange={setUploading}
        onUploadComplete={clearSelection}
        onItemCreated={handleItemCreated}
      />
    </div>
  );
};

export default UploadFlowPage;
