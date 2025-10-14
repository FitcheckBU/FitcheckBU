import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { onObjectFinalized } from "firebase-functions/v2/storage";

admin.initializeApp();

const visionClient = new vision.ImageAnnotatorClient();
const firestoreDatabaseId = defineString("FIRESTORE_DATABASE_ID");
const firestore = getFirestore(admin.app(), firestoreDatabaseId.value());

// Temporary in-memory session tracking
const sessionTracker: Record<string, string[]> = {};

export const onBatchImageUpload = onObjectFinalized(
  { region: "us-east1" },
  async (event) => {
    const object = event.data;
    const filePath = object.name;
    const bucketName = object.bucket;

    if (!filePath?.startsWith("uploads/")) return;
    if (!object.contentType?.startsWith("image/")) return;

    const [_, sessionId, fileName] = filePath.split("/");
    if (!sessionId) return;

    console.log(`🆕 New image in session ${sessionId}: ${fileName}`);

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

    // Prepare Vision API batch requests
    const requests: protos.google.cloud.vision.v1.IAnnotateImageRequest[] =
      sessionTracker[sessionId].map((path) => ({
        image: { source: { imageUri: `gs://${bucketName}/${path}` } },
        features: [{ type: "LABEL_DETECTION" as const }],
      }));

    console.log(
      " Images to analyze:",
      requests.map((r) => r.image?.source?.imageUri),
    );

    //  Run Vision API
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
