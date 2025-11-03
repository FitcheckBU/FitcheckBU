import vision, { protos } from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { getFirestore, type DocumentData } from "firebase-admin/firestore";
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

const assignFallbackRoles = (images: ItemImage[]): ItemImage[] => {
  if (images.length === 0) return images;

  const usedRoles = new Set<PhotoRole>(
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
