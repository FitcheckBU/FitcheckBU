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
      const storagePaths: string[] = [];
      const uploads = files.map(async ({ file, name }) => {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `uploads/${sessionId}/${safeName}`;
        const storageRef = ref(storage, storagePath);
        storagePaths.push(storagePath);
        await uploadBytes(storageRef, file);
      });

      await Promise.all(uploads);
      await addItem({
        name: "New item",
        category: "uncategorized",
        brand: "",
        color: "",
        condition: "unknown",
        price: 0,
        decade: "",
        style: "",
        sessionId,
        imageStoragePaths: storagePaths,
      });
      onUploadComplete?.();
      setStatus({
        message: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully.`,
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
        {uploading ? "Uploading..." : "Upload selected"}
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
