// Cloud Function for extracting text using Google Cloud Vision API
// Deploy this to Firebase Functions or Google Cloud Functions

import * as functions from "firebase-functions";
import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

export const extractText = functions.https.onCall(async (data: any) => {
  try {
    const image = data.image;

    if (!image) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Image data is required",
      );
    }

    // Call Google Cloud Vision API
    const [result] = await client.textDetection({
      image: {
        content: image,
      },
    });

    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return { text: "", success: false };
    }

    // The first detection contains all the text
    const fullText = detections[0].description || "";

    return {
      text: fullText,
      success: true,
    };
  } catch (error) {
    console.error("Vision API Error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to extract text from image",
    );
  }
});

// Alternative HTTP endpoint version (if you prefer REST)
export const extractTextHttp = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const image = req.body.image;

    if (!image) {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    const [result] = await client.textDetection({
      image: {
        content: image,
      },
    });

    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      res.json({ text: "", success: false });
      return;
    }

    const fullText = detections[0].description || "";

    res.json({
      text: fullText,
      success: true,
    });
  } catch (error) {
    console.error("Vision API Error:", error);
    res.status(500).json({ error: "Failed to extract text from image" });
  }
});
