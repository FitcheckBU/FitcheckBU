// index.ts
import * as admin from "firebase-admin";
import { onObjectFinalized } from "firebase-functions/v2/storage";

admin.initializeApp();

export const onImageUpload = onObjectFinalized(
  { region: "us-east1" },
  async (event) => {
    const object = event.data;
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath || !filePath.startsWith("uploads/")) {
      console.log("Not an upload in the uploads/ folder, skipping.");
      return;
    }

    console.log(`✅ File uploaded: ${filePath} (${contentType})`);
  },
);
