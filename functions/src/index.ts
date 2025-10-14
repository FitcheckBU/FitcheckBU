import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { onObjectFinalized } from "firebase-functions/v2/storage";

admin.initializeApp();

const visionClient = new vision.ImageAnnotatorClient();

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

    // Cleanup tracker (to avoid duplicate runs)
    delete sessionTracker[sessionId];
    console.log(`🧹 Cleaned up session tracker for ${sessionId}`);
  },
);
