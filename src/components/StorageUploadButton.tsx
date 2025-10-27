import { IonButton, IonIcon, IonSpinner, IonText } from "@ionic/react";
import { ref, uploadBytes } from "firebase/storage";
import { cloudUploadSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { PhotoRole } from "../constants/photoStages";
import { storage } from "../lib/firebaseClient";
import { addItem } from "../lib/inventoryService";

type UploadableFile = {
  id: string;
  name: string;
  file: File;
  role: PhotoRole;
};

interface StorageUploadButtonProps {
  files: UploadableFile[];
  disabled?: boolean;
  onUploadComplete?: () => void;
  onUploadingChange?: (uploading: boolean) => void;
  onItemCreated?: (itemId: string) => void;
}

type StatusState = {
  message: string;
  tone: "success" | "danger" | "";
};

const StorageUploadButton: React.FC<StorageUploadButtonProps> = ({
  files,
  disabled = false,
  onUploadComplete,
  onUploadingChange,
  onItemCreated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<StatusState>({ message: "", tone: "" });

  useEffect(() => {
    if (files.length > 0) {
      setStatus({ message: "", tone: "" });
    }
  }, [files]);

  const setUploadingState = (value: boolean) => {
    setUploading(value);
    onUploadingChange?.(value);
  };

  const handleUpload = async () => {
    if (files.length === 0 || uploading) {
      return;
    }

    setStatus({ message: "", tone: "" });
    setUploadingState(true);

    try {
      // Generate one sessionId shared by all uploaded photos
      const sessionId = uuidv4();

      const stagedUploads = files.map(({ file, name, role }, index) => {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const prefixedName = `${String(index + 1).padStart(2, "0")}_${role}_${safeName}`;
        const tempPath = `temp/${sessionId}/${prefixedName}`;
        return {
          file,
          name,
          role,
          tempPath,
          uploadPromise: uploadBytes(ref(storage, tempPath), file),
        };
      });

      const tempPaths = stagedUploads.map((entry) => entry.tempPath);
      const sessionImages = stagedUploads.map((entry) => ({
        role: entry.role,
        storagePath: entry.tempPath,
        originalName: entry.name,
      }));

      await Promise.all(stagedUploads.map((entry) => entry.uploadPromise));

      // Create draft item in Firestore
      const itemId = await addItem({
        name: "New Item",
        category: "uncategorized",
        brand: "",
        color: "",
        size: "",
        condition: "unknown",
        price: 0,
        decade: "",
        style: "",
        status: "draft", // Mark as draft until user fills details
        sessionId,
        imageStoragePaths: tempPaths, // Legacy list for backwards compatibility
        images: sessionImages,
      });

      // Cloud Function will automatically move images from temp to items/{itemId}
      // This happens in the background after item creation

      onItemCreated?.(itemId);
      onUploadComplete?.();
      setStatus({
        message: `${files.length} image${files.length > 1 ? "s" : ""} uploaded. Complete item details to publish.`,
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while uploading.";
      setStatus({ message, tone: "danger" });
    } finally {
      setUploadingState(false);
    }
  };

  const uploadDisabled = disabled || uploading || files.length === 0;

  return (
    <>
      <IonButton
        className="ion-margin-top"
        color="primary"
        expand="block"
        disabled={uploadDisabled}
        onClick={handleUpload}
      >
        {uploading ? (
          <IonSpinner slot="start" name="crescent" />
        ) : (
          <IonIcon slot="start" icon={cloudUploadSharp} />
        )}
        {uploading ? "Uploading..." : "Upload"}
      </IonButton>
      {status.message && (
        <IonText color={status.tone === "" ? undefined : status.tone}>
          <p className="ion-margin-top">{status.message}</p>
        </IonText>
      )}
    </>
  );
};

export default StorageUploadButton;
