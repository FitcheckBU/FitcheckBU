import React, { useRef, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonText,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { cameraReverse, checkmarkDoneCircle } from "ionicons/icons";
import { createWorker } from "tesseract.js";
import "./ScanCameraPage.css";

const ScanCameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const history = useHistory();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    };

    startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const extractBarcodeText = async (
    imageData: string,
  ): Promise<string | null> => {
    try {
      // Create an image element to work with
      const img = new Image();
      img.src = imageData;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create a canvas to crop the image to just the scanning frame area
      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d");

      if (!cropCtx) return null;

      // Calculate the scanning frame dimensions (80% width, 150px height, centered)
      const frameWidth = img.width * 0.8;
      const frameHeight = 150;
      const frameX = (img.width - frameWidth) / 2;
      const frameY = (img.height - frameHeight) / 2;

      // Set canvas to the cropped size
      cropCanvas.width = frameWidth;
      cropCanvas.height = frameHeight;

      // Draw only the scanning frame area
      cropCtx.drawImage(
        img,
        frameX,
        frameY,
        frameWidth,
        frameHeight, // Source rectangle
        0,
        0,
        frameWidth,
        frameHeight, // Destination rectangle
      );

      // Convert cropped canvas to image data
      const croppedImageData = cropCanvas.toDataURL("image/png");

      // Run OCR on the cropped image
      const worker = await createWorker("eng");

      // Configure Tesseract for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
      });

      const {
        data: { text },
      } = await worker.recognize(croppedImageData);
      await worker.terminate();

      console.log("OCR Raw text:", text);

      // Clean up the text - remove spaces and special characters
      const cleanText = text
        .replace(/\s+/g, "") // Remove all whitespace
        .replace(/[^A-Z0-9]/gi, "") // Keep only alphanumeric
        .toUpperCase();

      console.log("OCR Cleaned text:", cleanText);

      // Look for patterns that match our barcode format (8-15 characters)
      if (cleanText.length >= 8) {
        // Take first 12 characters to match the barcode format
        return cleanText.substring(0, 12);
      }

      return null;
    } catch (error) {
      console.error("OCR Error:", error);
      return null;
    }
  };

  const handleCaptureScan = async () => {
    if (isScanning || !videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageData = canvas.toDataURL("image/png");

      setToastMessage("Scanning barcode...");
      setShowToast(true);

      const barcode = await extractBarcodeText(imageData);

      if (barcode && barcode.length >= 8) {
        setScannedBarcode(barcode);
        setToastMessage(`Scanned: ${barcode}`);
        setShowToast(true);
      } else {
        setToastMessage("No barcode detected. Try again or use manual entry.");
        setShowToast(true);
      }
    }

    setIsScanning(false);
  };

  const handleDone = () => {
    if (scannedBarcode) {
      // Navigate to scan-flow with the scanned barcode
      history.push({
        pathname: "/scan-flow",
        search: "?mode=manual",
        state: { scannedBarcode },
      });
    } else {
      history.goBack();
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <IonPage>
      <IonContent scroll-y="false" className="camera-content">
        <div className="camera-container">
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-video-preview"
          />

          {/* Scanning guide overlay */}
          <div className="barcode-scanning-overlay">
            <div className="scanning-frame"></div>
            <IonText color="light" className="scanning-instruction">
              <p>Align barcode text within frame</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>
                Focus on the numbers below the barcode
              </p>
            </IonText>
          </div>
        </div>

        {/* Top-Left Close Button */}
        <IonFab vertical="top" horizontal="start" slot="fixed">
          <IonFabButton onClick={handleBack} color="light" size="small">
            <img src="/close.svg" alt="Close" className="close-button-icon" />
          </IonFabButton>
        </IonFab>

        {/* Top-Right Flip Camera Button */}
        <IonFab vertical="top" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleFlipCamera} color="light" size="small">
            <IonIcon icon={cameraReverse} />
          </IonFabButton>
        </IonFab>

        {/* Bottom-Center Scan Button */}
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton
            onClick={handleCaptureScan}
            className="scan-button"
            color="primary"
            disabled={isScanning}
          >
            {isScanning ? <IonSpinner name="crescent" /> : "Scan"}
          </IonFabButton>
        </IonFab>

        {/* Bottom-Right Done Button */}
        {scannedBarcode && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleDone} color="success">
              <IonIcon icon={checkmarkDoneCircle} />
            </IonFabButton>
          </IonFab>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ScanCameraPage;
