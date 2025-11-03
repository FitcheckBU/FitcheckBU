import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import OpenAI from "openai";

const visionClient = new vision.ImageAnnotatorClient();
const app = admin.initializeApp();
const firestore = getFirestore(app, "fitcheck-db");
const storage = getStorage(app);
const openAiApiKey = process.env.OPENAI_APIKEY;
const openAiClient = openAiApiKey
  ? new OpenAI({
      apiKey: openAiApiKey,
    })
  : null;

type PhotoRole = "front" | "back" | "label";

type ItemImage = {
  role?: PhotoRole;
  storagePath?: string;
  originalName?: string;
};

type MetadataStatus = "pending" | "complete" | "skipped" | "error";

const REQUIRED_ROLES: PhotoRole[] = ["front", "back", "label"];

const isPhotoRole = (value: unknown): value is PhotoRole =>
  typeof value === "string" &&
  (REQUIRED_ROLES as unknown as string[]).includes(value);

const assignFallbackRoles = (images: ItemImage[]): ItemImage[] => {
  if (images.length === 0) return images;

  const usedRoles = new Set(
    images
      .map((img) => img.role)
      .filter((role): role is PhotoRole => isPhotoRole(role)),
  );

  const remainingRoles = REQUIRED_ROLES.filter((role) => !usedRoles.has(role));

  if (remainingRoles.length === 0) return images;

  return images.map((image) => {
    if (isPhotoRole(image.role)) {
      return image;
    }
    const nextRole = remainingRoles.shift();
    if (!nextRole) {
      return image;
    }
    return { ...image, role: nextRole };
  });
};

const normalizeImages = (data?: DocumentData): ItemImage[] => {
  const rawImages = Array.isArray(data?.images)
    ? (data?.images as Array<Record<string, unknown>>)
    : [];

  const structuredImages = rawImages
    .filter(
      (img): img is Record<string, unknown> & { storagePath: string } =>
        Boolean(img?.storagePath) && typeof img.storagePath === "string",
    )
    .map((img) => ({
      role: isPhotoRole(img.role) ? (img.role as PhotoRole) : undefined,
      storagePath: img.storagePath as string,
      originalName:
        typeof img.originalName === "string" ? img.originalName : undefined,
    }));

  if (structuredImages.length > 0) {
    return assignFallbackRoles(structuredImages);
  }

  const legacyPaths = Array.isArray(data?.imageStoragePaths)
    ? (data?.imageStoragePaths as string[])
    : [];

  const legacyImages = legacyPaths
    .filter((path): path is string => typeof path === "string")
    .map((path) => ({ storagePath: path }));

  return assignFallbackRoles(legacyImages);
};

const getStoragePathsFromImages = (images: ItemImage[]): string[] =>
  images
    .map((image) => image.storagePath)
    .filter((path): path is string => typeof path === "string");

type GeneratedFields = {
  name?: string;
  brand?: string;
  category?: string;
  color?: string;
  condition?: string;
  size?: string;
  price?: number;
  decade?: string;
  style?: string;
  material?: string;
};

const cleanGeneratedText = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parsePrice = (value?: string | number): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.]/g, "");
    if (!normalized) return undefined;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const extractJson = (text: string): unknown => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(jsonMatch[0]);
};

const COLOR_KEYWORDS = [
  "black",
  "white",
  "gray",
  "grey",
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "brown",
  "beige",
  "tan",
  "navy",
  "maroon",
  "teal",
  "turquoise",
  "olive",
  "cream",
  "ivory",
  "gold",
  "silver",
  "burgundy",
  "khaki",
  "lavender",
  "mint",
  "coral",
  "peach",
  "indigo",
  "magenta",
  "cyan",
  "crimson",
  "scarlet",
  "charcoal",
];

const inferColorFromLabels = (labels: string[]): string | undefined => {
  for (const label of labels) {
    const lower = label.toLowerCase();
    for (const color of COLOR_KEYWORDS) {
      if (lower.includes(color)) {
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }
  }
  return undefined;
};

type PaletteEntry = {
  name: string;
  rgb: [number, number, number];
};

const COLOR_PALETTE: PaletteEntry[] = [
  { name: "Black", rgb: [0, 0, 0] },
  { name: "White", rgb: [255, 255, 255] },
  { name: "Gray", rgb: [128, 128, 128] },
  { name: "Red", rgb: [220, 20, 60] },
  { name: "Orange", rgb: [255, 140, 0] },
  { name: "Yellow", rgb: [255, 215, 0] },
  { name: "Green", rgb: [34, 139, 34] },
  { name: "Blue", rgb: [30, 144, 255] },
  { name: "Purple", rgb: [138, 43, 226] },
  { name: "Pink", rgb: [255, 105, 180] },
  { name: "Brown", rgb: [139, 69, 19] },
  { name: "Tan", rgb: [210, 180, 140] },
  { name: "Teal", rgb: [54, 117, 136] },
  { name: "Navy", rgb: [0, 0, 128] },
];

const colorDistance = (
  a: [number, number, number],
  b: [number, number, number],
) => {
  const [ar, ag, ab] = a;
  const [br, bg, bb] = b;
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
};

const matchPaletteColor = (rgb: [number, number, number]): string => {
  let bestMatch = COLOR_PALETTE[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of COLOR_PALETTE) {
    const distance = colorDistance(entry.rgb, rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = entry;
    }
  }
  return bestMatch.name;
};

const extractDominantColorVector = (
  colors: protos.google.cloud.vision.v1.IColorInfo[] | null | undefined,
): [number, number, number] | undefined => {
  if (!colors) return undefined;
  let bestVector: [number, number, number] | undefined;
  let bestScore = -Infinity;
  for (const colorInfo of colors) {
    if (!colorInfo?.color) continue;
    const { red = 0, green = 0, blue = 0 } = colorInfo.color;
    const fraction = colorInfo.pixelFraction ?? 0;
    const score = colorInfo.score ?? 0;
    const weight = fraction + score;
    if (weight > bestScore) {
      bestScore = weight;
      bestVector = [Number(red), Number(green), Number(blue)] as [
        number,
        number,
        number,
      ];
    }
  }
  return bestVector;
};

const extractColorFromResponse = (
  response: protos.google.cloud.vision.v1.IAnnotateImageResponse | undefined,
): string | undefined => {
  const colors =
    response?.imagePropertiesAnnotation?.dominantColors?.colors ?? [];
  const vector = extractDominantColorVector(colors);
  return vector ? matchPaletteColor(vector) : undefined;
};

const determineDominantColorName = (
  images: ItemImage[],
  responses: protos.google.cloud.vision.v1.IAnnotateImageResponse[],
): string | undefined => {
  const preferredIndices = [
    images.findIndex((image) => image.role === "front"),
    images.findIndex((image) => image.role === "back"),
    0,
  ].filter((index, i, arr) => index >= 0 && arr.indexOf(index) === i);

  for (const index of preferredIndices) {
    if (index < 0 || index >= responses.length) continue;
    const colorName = extractColorFromResponse(responses[index]);
    if (colorName) {
      return colorName;
    }
  }

  for (const response of responses) {
    const colorName = extractColorFromResponse(response);
    if (colorName) {
      return colorName;
    }
  }

  return undefined;
};

const generateInventoryFields = async (
  labels: string[],
  textBlocks: string[],
): Promise<GeneratedFields | undefined> => {
  if (!openAiClient || !openAiApiKey) {
    return undefined;
  }

  try {
    console.log("Calling OpenAI to generate inventory fields");
    const systemPrompt =
      "You are an assistant that extracts structured garment metadata from Vision labels and OCR text. Respond with concise JSON that matches the schema exactly.";
    const userPrompt = `Use the provided data to infer garment details for a vintage clothing inventory. When direct evidence is missing, make your best educated guess consistent with the signals; if you truly cannot infer anything meaningful for a field, set it to the string "unsure" (never leave it blank).\n\nLabels (highest confidence first):\n- ${labels.join(
      "\n- ",
    )}\n\nOCR text snippets (one per image):\n- ${textBlocks.join(
      "\n- ",
    )}\n\nReturn a JSON object with keys: name, brand, category, color, condition, material, size, price, decade, style. Use the number 0 for unknown price. Never omit keys.`;

    const response = await openAiClient.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const outputText = response.output_text ?? "";
    if (!outputText) {
      throw new Error("Model returned no text");
    }
    console.log("OpenAI response received:", outputText);

    const parsed = extractJson(outputText) as Record<string, unknown>;

    const ensureValue = (value?: string) =>
      cleanGeneratedText(value) ?? "unsure";

    const result: GeneratedFields = {
      name: cleanGeneratedText(parsed.name as string | undefined),
      brand: ensureValue(parsed.brand as string | undefined),
      category: ensureValue(parsed.category as string | undefined),
      color: ensureValue(parsed.color as string | undefined),
      condition: ensureValue(parsed.condition as string | undefined),
      material: ensureValue(parsed.material as string | undefined),
      size: ensureValue(parsed.size as string | undefined),
      price: parsePrice(parsed.price as string | number | undefined) ?? 0,
      decade: ensureValue(parsed.decade as string | undefined),
      style: ensureValue(parsed.style as string | undefined),
    };

    return result;
  } catch (error) {
    console.error("Failed to generate structured fields:", error);
    return undefined;
  }
};

const getAllStoragePaths = (data?: DocumentData): string[] => {
  const fromImages = getStoragePathsFromImages(normalizeImages(data));
  const legacy = Array.isArray(data?.imageStoragePaths)
    ? (data?.imageStoragePaths as string[])
    : [];
  const legacyPaths = legacy.filter(
    (path): path is string => typeof path === "string",
  );
  return Array.from(new Set([...fromImages, ...legacyPaths]));
};

const sortPaths = (paths: string[]): string[] => [...paths].sort();

const storagePathsChanged = (before: string[], after: string[]): boolean => {
  if (before.length !== after.length) return true;
  const beforeSorted = sortPaths(before);
  const afterSorted = sortPaths(after);
  return beforeSorted.some((path, index) => path !== afterSorted[index]);
};

const hasAllRequiredImages = (images: ItemImage[]): boolean =>
  REQUIRED_ROLES.every((role) =>
    images.some(
      (image) =>
        image.role === role &&
        typeof image.storagePath === "string" &&
        image.storagePath.startsWith("items/"),
    ),
  );

type PhotoRole = "front" | "back" | "label";

type ItemImage = {
  role?: PhotoRole;
  storagePath?: string;
  originalName?: string;
};

const REQUIRED_ROLES: PhotoRole[] = ["front", "back", "label"];

const isPhotoRole = (value: unknown): value is PhotoRole =>
  typeof value === "string" &&
  (REQUIRED_ROLES as unknown as string[]).includes(value);

const normalizeImages = (data?: DocumentData): ItemImage[] => {
  const rawImages = Array.isArray(data?.images)
    ? (data?.images as Array<Record<string, unknown>>)
    : [];

  const structuredImages = rawImages
    .filter(
      (img): img is Record<string, unknown> & { storagePath: string } =>
        Boolean(img?.storagePath) && typeof img.storagePath === "string",
    )
    .map((img) => ({
      role: isPhotoRole(img.role) ? (img.role as PhotoRole) : undefined,
      storagePath: img.storagePath as string,
      originalName:
        typeof img.originalName === "string" ? img.originalName : undefined,
    }));

  if (structuredImages.length > 0) {
    return structuredImages;
  }

  const legacyPaths = Array.isArray(data?.imageStoragePaths)
    ? (data?.imageStoragePaths as string[])
    : [];

  return legacyPaths
    .filter((path): path is string => typeof path === "string")
    .map((path) => ({ storagePath: path }));
};

const getStoragePathsFromImages = (images: ItemImage[]): string[] =>
  images
    .map((image) => image.storagePath)
    .filter((path): path is string => typeof path === "string");

const getAllStoragePaths = (data?: DocumentData): string[] => {
  const fromImages = getStoragePathsFromImages(normalizeImages(data));
  const legacy = Array.isArray(data?.imageStoragePaths)
    ? (data?.imageStoragePaths as string[])
    : [];
  const legacyPaths = legacy.filter(
    (path): path is string => typeof path === "string",
  );
  return Array.from(new Set([...fromImages, ...legacyPaths]));
};

const sortPaths = (paths: string[]): string[] => [...paths].sort();

const storagePathsChanged = (before: string[], after: string[]): boolean => {
  if (before.length !== after.length) return true;
  const beforeSorted = sortPaths(before);
  const afterSorted = sortPaths(after);
  return beforeSorted.some((path, index) => path !== afterSorted[index]);
};

const hasAllRequiredImages = (images: ItemImage[]): boolean =>
  REQUIRED_ROLES.every((role) =>
    images.some(
      (image) =>
        image.role === role &&
        typeof image.storagePath === "string" &&
        image.storagePath.startsWith("items/"),
    ),
  );

// Run Vision AI analysis on a Firestore item
async function analyzeItemImages(itemId: string, images: ItemImage[]) {
  const storedImages = images.filter(
    (image): image is ItemImage & { storagePath: string } =>
      typeof image.storagePath === "string" &&
      image.storagePath.startsWith("items/"),
  );

  console.log(
    "Stored image metadata:",
    storedImages.map((image) => ({
      path: image.storagePath,
      role: image.role ?? "undefined",
    })),
  );

  if (storedImages.length === 0) {
    console.log(`No permanent images to analyze for item ${itemId}`);
    return;
  }

  console.log(
    `Running Vision analysis for item ${itemId} with ${storedImages.length} images`,
  );

  const bucketName = storage.bucket().name;

  // Prepare Vision API batch requests
  const requests: protos.google.cloud.vision.v1.IAnnotateImageRequest[] =
    storedImages.map((image) => ({
      image: {
        source: { imageUri: `gs://${bucketName}/${image.storagePath}` },
      },
      features: [
        { type: "LABEL_DETECTION" as const },
        { type: "IMAGE_PROPERTIES" as const },
      ],
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
    const image = storedImages[i];
    const labels =
      res.labelAnnotations?.map((l) => ({
        description: l.description,
        score: l.score,
      })) ?? [];

    if (labels.length === 0) {
      console.warn(`No labels detected for ${image?.storagePath ?? "unknown"}`);
    } else {
      console.log(
        `Labels for ${image?.storagePath ?? "unknown"}:`,
        JSON.stringify(labels, null, 2),
      );
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

  const labelColorFallback = inferColorFromLabels(labelList);
  const dominantColorName = determineDominantColorName(storedImages, responses);

  // Attempt OCR on every stored image
  const textSnippets: string[] = [];
  await Promise.all(
    storedImages.map(async (image) => {
      try {
        const [textResult] = await visionClient.textDetection(
          `gs://${bucketName}/${image.storagePath}`,
        );
        const annotations = textResult.textAnnotations ?? [];
        const fullText = annotations[0]?.description?.trim();
        if (fullText) {
          textSnippets.push(fullText);
          console.log(
            `Extracted text for image ${image.storagePath}:`,
            fullText,
          );
        } else {
          console.log(
            `No text detected for image ${image.storagePath} (role: ${image.role ?? "unset"})`,
          );
        }
      } catch (ocrError) {
        console.error(
          `Failed to extract text for image ${image.storagePath}:`,
          ocrError,
        );
      }
    }),
  );
  const labelText =
    textSnippets
      .map((snippet) => snippet.trim())
      .filter((snippet) => snippet.length > 0)
      .join(" ")
      .trim() || undefined;

  let generatedFields: GeneratedFields | undefined;
  let metadataStatus: MetadataStatus = openAiClient ? "error" : "skipped";
  if (openAiClient) {
    generatedFields = await generateInventoryFields(labelList, textSnippets);
    metadataStatus = generatedFields ? "complete" : "error";
  } else {
    console.log("OpenAI client not configured; skipping metadata generation");
  }

  // Update Firestore with labels and optional labelText
  try {
    const itemRef = firestore.collection("items").doc(itemId);
    const updatePayload: Record<string, unknown> = {
      labels: labelList,
    };
    if (labelText) {
      updatePayload.labelText = labelText;
      console.log(`Including labelText in update for item ${itemId}`);
    }

    updatePayload.metadataStatus = metadataStatus;

    if (generatedFields) {
      const {
        name,
        brand,
        category,
        color,
        condition,
        size,
        price,
        decade,
        style,
        material,
      } = generatedFields;

      if (name) updatePayload.name = name;
      if (brand) updatePayload.brand = brand;
      if (category) updatePayload.category = category;
      if (condition) updatePayload.condition = condition;
      if (size && size.toLowerCase() !== "unsure") updatePayload.size = size;
      if (Number.isFinite(price) && typeof price === "number") {
        updatePayload.price = price;
      }
      if (decade) updatePayload.decade = decade;
      if (style) updatePayload.style = style;
      if (material) updatePayload.material = material;

      const llmColor =
        color && color.toLowerCase() !== "unsure" ? color : undefined;
      if (llmColor && !dominantColorName) {
        updatePayload.color = llmColor;
      }

      console.log(
        `Including generated fields for item ${itemId}:`,
        JSON.stringify(generatedFields),
      );
    }

    if (!updatePayload.color && dominantColorName) {
      updatePayload.color = dominantColorName;
      console.log(
        `Using Vision-detected color for item ${itemId}: ${dominantColorName}`,
      );
    }

    if (!updatePayload.color && labelColorFallback) {
      updatePayload.color = labelColorFallback;
      console.log(
        `Using label-derived color fallback for item ${itemId}: ${labelColorFallback}`,
      );
    }

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

    const beforeImages = normalizeImages(beforeData);
    const afterImages = normalizeImages(afterData);
    const beforePaths = getStoragePathsFromImages(beforeImages);
    const afterPaths = getStoragePathsFromImages(afterImages);

    // Check if paths changed and now point to items/
    const pathsChanged = storagePathsChanged(beforePaths, afterPaths);
    const readyForVision = hasAllRequiredImages(afterImages);
    const labelsEmpty = !afterData?.labels || afterData.labels.length === 0;
    const needsLabelText = !afterData?.labelText;

    if (pathsChanged && readyForVision && (labelsEmpty || needsLabelText)) {
      console.log(
        `Images moved to permanent location for item ${itemId}, running Vision AI`,
      );
      await analyzeItemImages(itemId, afterImages);
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

    const normalizedImages = normalizeImages(data);
    if (normalizedImages.length === 0) {
      console.log(`No images to process for item ${itemId}`);
      return;
    }

    const hasTempImages = normalizedImages.some((image) =>
      image.storagePath?.startsWith("temp/"),
    );
    if (!hasTempImages) {
      console.log(`Images already processed for item ${itemId}`);
      return;
    }

    console.log(
      `Processing ${normalizedImages.length} images for item ${itemId}`,
    );

    const bucket = storage.bucket();
    const updatedImages: ItemImage[] = [];
    const newPaths: string[] = [];

    try {
      // Move each image from temp to items/{itemId}
      for (let i = 0; i < normalizedImages.length; i++) {
        const image = normalizedImages[i];
        const sourcePath = image.storagePath;
        if (!sourcePath) continue;

        const fileExtension = sourcePath.split(".").pop() || "jpg";
        const roleSegment =
          image.role ?? `image_${String(i + 1).padStart(2, "0")}`;
        const sanitizedRole = roleSegment.replace(/[^a-z0-9_-]/gi, "_");
        const fileName = `${String(i + 1).padStart(2, "0")}_${sanitizedRole}.${fileExtension}`;
        let destinationPath = `items/${itemId}/${fileName}`;

        if (sourcePath.startsWith("temp/")) {
          try {
            await bucket.file(sourcePath).move(bucket.file(destinationPath));
            console.log(`Moved ${sourcePath} → ${destinationPath}`);
          } catch (moveError) {
            console.error(`Failed to move ${sourcePath}:`, moveError);
            destinationPath = sourcePath;
          }
        } else {
          destinationPath = sourcePath;
        }

        newPaths.push(destinationPath);
        updatedImages.push({
          role: image.role,
          storagePath: destinationPath,
          originalName: image.originalName,
        });
      }

      // Update item with new permanent paths
      // This will trigger analyzeAfterImageMove
      await event.data?.ref.update({
        imageStoragePaths: newPaths,
        images: updatedImages,
      });

      console.log(
        `✅ Updated item ${itemId} with ${newPaths.length} permanent paths`,
      );

      // Clean up empty temp folder
      const sessionId =
        typeof data?.sessionId === "string"
          ? (data.sessionId as string)
          : undefined;
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

    const pathsToDelete = getAllStoragePaths(data);
    if (pathsToDelete.length === 0) {
      console.log(`No images to cleanup for item ${itemId}`);
      return;
    }

    console.log(
      `Cleaning up ${pathsToDelete.length} images for deleted item ${itemId}`,
    );

    const bucket = storage.bucket();

    try {
      // Delete all images for this item
      const deletePromises = pathsToDelete.map((path) =>
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
