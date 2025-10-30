import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

const visionClient = new vision.ImageAnnotatorClient();
const app = admin.initializeApp();
const firestore = getFirestore(app, "fitcheck-db");
const storage = getStorage(app);

// Run Vision AI analysis on a Firestore item
async function analyzeItemImages(itemId: string, imageStoragePaths: string[]) {
  if (!imageStoragePaths || imageStoragePaths.length === 0) {
    console.log(`No images to analyze for item ${itemId}`);
    return;
  }

  console.log(
    `Running Vision analysis for item ${itemId} with ${imageStoragePaths.length} images`,
  );

  const bucketName = storage.bucket().name;

  // Prepare Vision API batch requests
  const requests: protos.google.cloud.vision.v1.IAnnotateImageRequest[] =
    imageStoragePaths.map((path) => ({
      image: { source: { imageUri: `gs://${bucketName}/${path}` } },
      features: [{ type: "LABEL_DETECTION" as const }],
    }));

  console.log(
    "Images to analyze:",
    requests.map((r) => r.image?.source?.imageUri),
  );

  // Run Vision API
  const [batchResponse] = await visionClient.batchAnnotateImages({
    requests,
  });

  // Log results
  const responses = batchResponse.responses ?? [];
  responses.forEach((res, i) => {
    const image = imageStoragePaths[i];
    const labels =
      res.labelAnnotations?.map((l) => ({
        description: l.description,
        score: l.score,
      })) ?? [];

    if (labels.length === 0) {
      console.warn(`No labels detected for ${image}`);
    } else {
      console.log(`Labels for ${image}:`, JSON.stringify(labels, null, 2));
    }
  });

  // Aggregate labels across the batch
  const aggregatedLabels = new Map<string, number>();
  responses.forEach((res) => {
    res.labelAnnotations?.forEach((label) => {
      if (!label.description || label.score === undefined) return;
      const existingScore = aggregatedLabels.get(label.description) ?? 0;
      const score = label.score ?? 0;
      if (score > existingScore) {
        aggregatedLabels.set(label.description, score);
      }
    });
  });

  const labelList = Array.from(aggregatedLabels.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([description]) => description)
    .slice(0, 10);

  // Update Firestore with labels
  try {
    const itemRef = firestore.collection("items").doc(itemId);
    const updatePayload: Record<string, unknown> = {
      labels: labelList,
    };

    const doc = await itemRef.get();
    const currentDescription = doc.get("description");
    if (!currentDescription && labelList.length > 0) {
      updatePayload.description = labelList.join(", ");
    }

    await itemRef.update(updatePayload);
    console.log(`✅ Updated item ${itemId} with ${labelList.length} labels`);
  } catch (error) {
    console.error(`Failed to update item ${itemId} with labels:`, error);
  }
}

// NEW: Trigger Vision AI when images are moved to permanent location
export const analyzeAfterImageMove = onDocumentUpdated(
  {
    document: "items/{itemId}",
    region: "us-east1",
    database: "fitcheck-db",
  },
  async (event) => {
    const itemId = event.params.itemId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Only run if imageStoragePaths changed from temp/ to items/
    const beforePaths = beforeData?.imageStoragePaths || [];
    const afterPaths = afterData?.imageStoragePaths || [];

    // Check if paths changed and now point to items/
    const pathsChanged =
      JSON.stringify(beforePaths) !== JSON.stringify(afterPaths);
    const nowInItems =
      afterPaths.length > 0 && afterPaths[0].startsWith("items/");
    const labelsEmpty = !afterData?.labels || afterData.labels.length === 0;

    if (pathsChanged && nowInItems && labelsEmpty) {
      console.log(
        `Images moved to permanent location for item ${itemId}, running Vision AI`,
      );
      await analyzeItemImages(itemId, afterPaths);
    }
  },
);

// Move images from temp to permanent location after item creation
export const processNewItem = onDocumentCreated(
  {
    document: "items/{itemId}",
    region: "us-east1",
    database: "fitcheck-db",
  },
  async (event) => {
    const itemId = event.params.itemId;
    const data = event.data?.data();

    if (!data?.imageStoragePaths || data.imageStoragePaths.length === 0) {
      console.log(`No images to process for item ${itemId}`);
      return;
    }

    // Only process if images are still in temp folder
    const firstPath = data.imageStoragePaths[0];
    if (!firstPath.startsWith("temp/")) {
      console.log(`Images already processed for item ${itemId}`);
      return;
    }

    console.log(
      `Processing ${data.imageStoragePaths.length} images for item ${itemId}`,
    );

    const bucket = storage.bucket();
    const newPaths: string[] = [];

    try {
      // Move each image from temp to items/{itemId}
      for (let i = 0; i < data.imageStoragePaths.length; i++) {
        const tempPath = data.imageStoragePaths[i];
        const fileExtension = tempPath.split(".").pop() || "jpg";
        const fileName =
          i === 0
            ? `thumbnail.${fileExtension}`
            : `image_${String(i).padStart(3, "0")}.${fileExtension}`;
        const newPath = `items/${itemId}/${fileName}`;

        try {
          await bucket.file(tempPath).move(bucket.file(newPath));
          newPaths.push(newPath);
          console.log(`Moved ${tempPath} → ${newPath}`);
        } catch (moveError) {
          console.error(`Failed to move ${tempPath}:`, moveError);
          // Keep the temp path if move fails
          newPaths.push(tempPath);
        }
      }

      // Update item with new permanent paths
      // This will trigger analyzeAfterImageMove
      await event.data?.ref.update({
        imageStoragePaths: newPaths,
      });

      console.log(
        `✅ Updated item ${itemId} with ${newPaths.length} permanent paths`,
      );

      // Clean up empty temp folder
      const sessionId = data.sessionId;
      if (sessionId) {
        try {
          const [files] = await bucket.getFiles({
            prefix: `temp/${sessionId}/`,
          });
          if (files.length === 0) {
            console.log(`Temp folder temp/${sessionId}/ is empty (cleaned up)`);
          }
        } catch (cleanupError) {
          console.error(`Failed to check temp folder:`, cleanupError);
        }
      }
    } catch (error) {
      console.error(`Error processing images for item ${itemId}:`, error);
    }
  },
);

// Clean up images when item is deleted
export const cleanupItemImages = onDocumentDeleted(
  {
    document: "items/{itemId}",
    region: "us-east1",
    database: "fitcheck-db",
  },
  async (event) => {
    const itemId = event.params.itemId;
    const data = event.data?.data();

    if (!data?.imageStoragePaths || data.imageStoragePaths.length === 0) {
      console.log(`No images to cleanup for item ${itemId}`);
      return;
    }

    console.log(
      `Cleaning up ${data.imageStoragePaths.length} images for deleted item ${itemId}`,
    );

    const bucket = storage.bucket();

    try {
      // Delete all images for this item
      const deletePromises = data.imageStoragePaths.map((path: string) =>
        bucket
          .file(path)
          .delete()
          .catch((error) => {
            console.warn(`Failed to delete ${path}:`, error.message);
            // Don't throw - continue deleting other files
          }),
      );

      await Promise.all(deletePromises);
      console.log(`✅ Cleaned up images for item ${itemId}`);
    } catch (error) {
      console.error(`Error during cleanup for item ${itemId}:`, error);
    }
  },
);

//getText function
export { extractText, extractTextHttp } from "./extractText";
