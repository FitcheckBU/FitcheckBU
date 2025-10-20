import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { defineString } from "firebase-functions/params";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";

const firestoreDatabaseId = defineString("FIRESTORE_DATABASE_ID");
const visionClient = new vision.ImageAnnotatorClient();
const firestore = firestoreDatabaseId.value()
  ? getFirestore(admin.initializeApp(), firestoreDatabaseId.value())
  : getFirestore(admin.initializeApp());
const storage = getStorage();

// Temporary in-memory session tracking
const sessionTracker: Record<string, string[]> = {}; // This keeps track of all images associated in one session

export const onBatchImageUpload = onObjectFinalized(
  { region: "us-east1" },
  async (event) => {
    const object = event.data;
    const filePath = object.name;
    const bucketName = object.bucket;

    if (!filePath?.startsWith("uploads/") && !filePath?.startsWith("temp/"))
      return;
    if (!object.contentType?.startsWith("image/")) return;

    const [_, sessionId, fileName] = filePath.split("/");
    if (!sessionId) return;

    console.log(`New image in session ${sessionId}: ${fileName}`);

    // Track images uploaded in this session
    if (!sessionTracker[sessionId]) sessionTracker[sessionId] = [];
    sessionTracker[sessionId].push(filePath);

    // Wait until enough images uploaded before analysis
    if (sessionTracker[sessionId].length < 1) {
      console.log(
        `Session ${sessionId}: waiting for more images (${sessionTracker[sessionId].length}/1).`,
      );
      return;
    }

    // Delay to ensure GCS replication (prevents partial reads)
    console.log(
      `Waiting 5 seconds before Vision analysis for session ${sessionId}...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log(`Running batch analysis for session ${sessionId}...`);

    // Prepare Vision API batch requests for every image in session tracker
    const requests: protos.google.cloud.vision.v1.IAnnotateImageRequest[] =
      sessionTracker[sessionId].map((path) => ({
        image: { source: { imageUri: `gs://${bucketName}/${path}` } },
        features: [{ type: "LABEL_DETECTION" as const }],
      }));

    console.log(
      " Images to analyze:",
      requests.map((r) => r.image?.source?.imageUri),
    );
    //Logs all image URLs in requests

    //  Run Vision API, batchResponse.responses is a group of requests for each image
    const [batchResponse] = await visionClient.batchAnnotateImages({
      requests,
    });

    // Log results
    const responses = batchResponse.responses ?? [];
    responses.forEach((res, i) => {
      const image = sessionTracker[sessionId][i];
      const labels =
        res.labelAnnotations?.map((l) => ({
          description: l.description,
          score: l.score,
        })) ?? [];

      if (labels.length === 0) {
        console.warn(` No labels detected for ${image}`);
      } else {
        console.log(`Labels for ${image}:`, JSON.stringify(labels, null, 2));
      }
      //So we should see log for every image that was properly analyzed
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

    // Update Firestore document linked to this session
    try {
      const snapshot = await firestore
        .collection("items")
        .where("sessionId", "==", sessionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`No inventory item found for session ${sessionId}`);
      } else {
        const docRef = snapshot.docs[0].ref;
        const updatePayload: Record<string, unknown> = {
          labels: labelList,
        };

        const currentDescription = snapshot.docs[0].get("description");
        if (!currentDescription && labelList.length > 0) {
          updatePayload.description = labelList.join(", ");
        }

        await docRef.update(updatePayload);
        console.log(
          `Updated item ${docRef.id} with ${labelList.length} labels.`,
        );
      }
    } catch (updateError) {
      console.error(
        `Failed to update inventory item for session ${sessionId}:`,
        updateError,
      );
    }

    // Cleanup tracker (to avoid duplicate runs)
    delete sessionTracker[sessionId];
    console.log(`🧹 Cleaned up session tracker for ${sessionId}`);
  },
);

// Move images from temp to permanent location after item creation
export const processNewItem = onDocumentCreated(
  {
    document: "items/{itemId}",
    region: "us-east1",
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

// NEW: Clean up images when item is deleted
export const cleanupItemImages = onDocumentDeleted(
  {
    document: "items/{itemId}",
    region: "us-east1",
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
