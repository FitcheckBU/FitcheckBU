// index.ts
import vision from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { onObjectFinalized } from "firebase-functions/v2/storage";

admin.initializeApp();

const visionClient = new vision.ImageAnnotatorClient();

export const onImageUpload = onObjectFinalized(
  { region: "us-east1" },
  async (event) => {
    const object = event.data;
    const bucketName = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath || !filePath.startsWith("uploads/")) {
      console.log("Not an upload in the uploads/ folder, skipping.");
      return;
    }

    if (!contentType?.startsWith("image/")) {
      console.log(`Skipping non-image file: ${filePath}`);
      return;
    }

    const gcsUri = `gs://${bucketName}/${filePath}`;
    const [result] = await visionClient.labelDetection(gcsUri);
    const labels = result.labelAnnotations?.map((l) => ({
      description: l.description,
      score: l.score,
    }));

    console.log(`Labels for ${filePath}:`, labels);
  },
);
