import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import { onObjectFinalized } from "firebase-functions/v2/storage";

const firestoreDatabaseId = defineString("FIRESTORE_DATABASE_ID");
const visionClient = new vision.ImageAnnotatorClient();
const firestore = firestoreDatabaseId.value()
  ? getFirestore(admin.initializeApp(), firestoreDatabaseId.value())
  : getFirestore(admin.initializeApp());

// Temporary in-memory session tracking
const sessionTracker: Record<string, string[]> = {}; // This keeps track of all images associated in one session

type VisionInsights = {
  labels: string[];
  descriptionSuggestion?: string;
  colorSuggestion?: string;
  sizeSuggestion?: string;
  conditionSuggestion?: string;
};

const COLOR_PALETTE: Array<{ name: string; rgb: [number, number, number] }> = [
  { name: "black", rgb: [0, 0, 0] },
  { name: "white", rgb: [255, 255, 255] },
  { name: "gray", rgb: [128, 128, 128] },
  { name: "silver", rgb: [192, 192, 192] },
  { name: "red", rgb: [220, 20, 60] },
  { name: "orange", rgb: [255, 140, 0] },
  { name: "yellow", rgb: [255, 215, 0] },
  { name: "green", rgb: [34, 139, 34] },
  { name: "teal", rgb: [0, 128, 128] },
  { name: "blue", rgb: [30, 144, 255] },
  { name: "navy", rgb: [0, 0, 128] },
  { name: "purple", rgb: [128, 0, 128] },
  { name: "pink", rgb: [255, 105, 180] },
  { name: "brown", rgb: [139, 69, 19] },
  { name: "beige", rgb: [245, 245, 220] },
  { name: "gold", rgb: [212, 175, 55] },
];

const computeColorDistance = (
  base: protos.google.type.IColor | null | undefined,
  target: { rgb: [number, number, number] },
): number => {
  if (!base) return Number.POSITIVE_INFINITY;
  const red = base.red ?? 0;
  const green = base.green ?? 0;
  const blue = base.blue ?? 0;
  const [r, g, b] = target.rgb;
  return Math.sqrt(
    Math.pow(red - r, 2) + Math.pow(green - g, 2) + Math.pow(blue - b, 2),
  );
};

const mapColorToPalette = (
  color: protos.google.type.IColor | null | undefined,
): string | undefined => {
  if (!color) return undefined;
  let bestMatch: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of COLOR_PALETTE) {
    const distance = computeColorDistance(color, entry);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = entry.name;
    }
  }
  return bestMatch;
};

const inferSizeFromSignals = (
  textSnippets: string[],
  labels: string[],
): string | undefined => {
  const corpus = `${textSnippets.join(" ")} ${labels.join(" ")}`.toLowerCase();
  const normalizedCorpus = corpus.replace(/\s+/g, " ");

  const sizeKeywordRules: Array<{ regex: RegExp; value: string }> = [
    {
      regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(xxxl|3xl|triple\s*xl)\b/,
      value: "XXXL",
    },
    {
      regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(xxl|2xl|double\s*xl)\b/,
      value: "XXL",
    },
    {
      regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(xl|x-large|extra\s+large)\b/,
      value: "XL",
    },
    { regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(l|large)\b/, value: "L" },
    { regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(m|medium)\b/, value: "M" },
    { regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(s|small)\b/, value: "S" },
    {
      regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(xs|extra\s+small)\b/,
      value: "XS",
    },
    {
      regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(xxs|2xs|double\s*xs)\b/,
      value: "XXS",
    },
    {
      regex: /\b(?:size|sz)\s*(?:[:\-]?\s*)?(xxxs|3xs|triple\s*xs)\b/,
      value: "XXXS",
    },
  ];

  for (const rule of sizeKeywordRules) {
    const match = normalizedCorpus.match(rule.regex);
    if (match) return rule.value;
  }

  const standaloneSizeRules: Array<{ regex: RegExp; value: string }> = [
    { regex: /\bxxxl\b/, value: "XXXL" },
    { regex: /\bxxl\b/, value: "XXL" },
    { regex: /\bxl\b/, value: "XL" },
    { regex: /\bl\b/, value: "L" },
    { regex: /\bm\b/, value: "M" },
    { regex: /\bs\b/, value: "S" },
    { regex: /\bxs\b/, value: "XS" },
    { regex: /\bxxs\b/, value: "XXS" },
    { regex: /\bxxxs\b/, value: "XXXS" },
  ];

  if (/\bsize\b/.test(normalizedCorpus)) {
    for (const rule of standaloneSizeRules) {
      const match = normalizedCorpus.match(rule.regex);
      if (match) return rule.value;
    }
  }

  const measurementRules: Array<{
    regex: RegExp;
    format: (match: RegExpMatchArray) => string;
  }> = [
    {
      regex: /\b(\d{2}\s?[x×]\s?\d{2})\b/,
      format: (match) =>
        match[1].toUpperCase().replace(/\s+/g, "").replace(/×/g, "X"),
    },
    {
      regex: /\bsize\s*(\d{1,3}(?:\s?(?:cm|in|\"))?)\b/,
      format: (match) => match[1].toUpperCase().replace(/\s+/g, ""),
    },
    {
      regex: /\b(\d{2})\s*(?:cm|in|")\b/,
      format: (match) => match[0].toUpperCase().replace(/\s+/g, ""),
    },
    {
      regex: /\bwaist\s*(\d{2})\b/,
      format: (match) => `W${match[1]}`,
    },
    {
      regex: /\binseam\s*(\d{2})\b/,
      format: (match) => `INSEAM${match[1]}`,
    },
    {
      regex: /\b(us|uk|eu|fr|it)\s*(\d{1,2})\b/,
      format: (match) => `${match[1].toUpperCase()} ${match[2]}`,
    },
  ];

  for (const rule of measurementRules) {
    const match = normalizedCorpus.match(rule.regex);
    if (match) {
      return rule.format(match);
    }
  }

  return undefined;
};

const inferConditionFromSignals = (
  labels: string[],
  textSnippets: string[],
): string | undefined => {
  const corpus = `${labels.join(" ")} ${textSnippets.join(" ")}`.toLowerCase();

  const conditionRules: Array<{ value: string; patterns: RegExp[] }> = [
    {
      value: "new",
      patterns: [
        /\bbrand new\b/,
        /\bnew with tags\b/,
        /\bnwt\b/,
        /\bdeadstock\b/,
      ],
    },
    {
      value: "like new",
      patterns: [
        /\blike new\b/,
        /\bnwot\b/,
        /\bexcellent condition\b/,
        /\bmint condition\b/,
      ],
    },
    {
      value: "vintage",
      patterns: [/\bvintage\b/, /\bretro\b/, /\bheritage\b/],
    },
    {
      value: "used",
      patterns: [
        /\bpre[-\s]?owned\b/,
        /\bsecond hand\b/,
        /\bused\b(?!\s+(?:for|to))/,
        /\bworn\b/,
      ],
    },
  ];

  for (const rule of conditionRules) {
    if (rule.patterns.some((pattern) => pattern.test(corpus))) {
      return rule.value;
    }
  }

  return undefined;
};

const aggregateVisionInsights = (
  responses: protos.google.cloud.vision.v1.IAnnotateImageResponse[],
): VisionInsights => {
  const aggregatedLabels = new Map<string, number>();
  const textSnippets: string[] = [];
  const colorScores = new Map<string, number>();

  responses.forEach((res) => {
    res.labelAnnotations?.forEach((label) => {
      if (!label.description || label.score === undefined) return;
      const existingScore = aggregatedLabels.get(label.description) ?? 0;
      const score = label.score ?? 0;
      if (score > existingScore) {
        aggregatedLabels.set(label.description, score);
      }
    });

    res.textAnnotations?.forEach((annotation) => {
      if (annotation.description) textSnippets.push(annotation.description);
    });

    res.imagePropertiesAnnotation?.dominantColors?.colors?.forEach(
      (colorInfo) => {
        const colorName = mapColorToPalette(colorInfo.color);
        if (!colorName) return;
        const weight = colorInfo.pixelFraction ?? colorInfo.score ?? 0;
        const currentWeight = colorScores.get(colorName) ?? 0;
        colorScores.set(colorName, currentWeight + (weight || 0.001));
      },
    );
  });

  const labels = Array.from(aggregatedLabels.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([description]) => description)
    .slice(0, 10);

  let colorSuggestion: string | undefined;
  if (colorScores.size > 0) {
    colorSuggestion = Array.from(colorScores.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0][0];
  }

  const sizeSuggestion = inferSizeFromSignals(textSnippets, labels);
  const conditionSuggestion = inferConditionFromSignals(labels, textSnippets);

  return {
    labels,
    descriptionSuggestion: labels.length > 0 ? labels.join(", ") : undefined,
    colorSuggestion,
    sizeSuggestion,
    conditionSuggestion,
  };
};

const shouldUpdateStringField = (current: unknown): boolean => {
  if (typeof current !== "string") return true;
  const normalized = current.trim().toLowerCase();
  return normalized === "" || normalized === "unknown";
};

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
        features: [
          { type: "LABEL_DETECTION" as const, maxResults: 25 },
          { type: "IMAGE_PROPERTIES" as const },
          { type: "TEXT_DETECTION" as const, maxResults: 50 },
        ],
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

    const insights = aggregateVisionInsights(responses);
    const labelList = insights.labels;

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
        if (!currentDescription && insights.descriptionSuggestion) {
          updatePayload.description = insights.descriptionSuggestion;
        }

        const currentColor = snapshot.docs[0].get("color");
        if (insights.colorSuggestion && shouldUpdateStringField(currentColor)) {
          updatePayload.color = insights.colorSuggestion;
        }

        const currentSize = snapshot.docs[0].get("size");
        if (insights.sizeSuggestion && shouldUpdateStringField(currentSize)) {
          updatePayload.size = insights.sizeSuggestion;
        }

        const currentCondition = snapshot.docs[0].get("condition");
        if (
          insights.conditionSuggestion &&
          shouldUpdateStringField(currentCondition)
        ) {
          updatePayload.condition = insights.conditionSuggestion;
        }

        await docRef.update(updatePayload);
        console.log(
          `Updated item ${docRef.id} with Vision insights: labels=${labelList.length}, color=${updatePayload.color ?? "unchanged"}, size=${updatePayload.size ?? "unchanged"}, condition=${updatePayload.condition ?? "unchanged"}.`,
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
