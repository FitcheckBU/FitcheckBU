import { IonButton, IonIcon, IonSpinner, IonText } from "@ionic/react";
import { ref, uploadBytes } from "firebase/storage";
import { cloudUploadSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../lib/firebaseClient";
import { addItem } from "../lib/inventoryService";

type UploadableFile = {
  id: string;
  name: string;
  file: File;
};

interface StorageUploadButtonProps {
  files: UploadableFile[];
  disabled?: boolean;
  onUploadComplete?: () => void;
  onUploadingChange?: (uploading: boolean) => void;
  onItemCreated?: (itemId: string, sessionId: string) => void;
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

      // Upload to temp location first
      const tempPaths: string[] = [];
      const uploads = files.map(async ({ file, name }) => {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Upload to temp folder instead of uploads
        const tempPath = `temp/${sessionId}/${safeName}`;
        const storageRef = ref(storage, tempPath);
        tempPaths.push(tempPath);
        await uploadBytes(storageRef, file);
      });

      await Promise.all(uploads);

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
        imageStoragePaths: tempPaths, // Store temp paths
      });

      // Cloud Function will automatically move images from temp to items/{itemId}
      // This happens in the background after item creation

      onItemCreated?.(itemId, sessionId);
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
