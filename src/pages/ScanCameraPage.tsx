/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from "@ionic/react";
import { cameraReverse, checkmarkDoneCircle } from "ionicons/icons";
import "./ScanCameraPage.css";

// Simple barcode detection using canvas image analysis
const detectBarcodeFromImage = (imageData: ImageData): string | null => {
  // This is a simplified barcode detection
  // In production, you'd use a library like @zxing/library or quagga2
  // For now, return null and rely on manual entry
  // TODO: Implement proper barcode scanning library
  // instead of placeholder - we will use OCR as a placeholder while we wait on barcode hardware/software setup
  return null;
};

const ScanCameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      if (scanningIntervalRef.current) {
        clearInterval(scanningIntervalRef.current);
      }
    };
  }, [facingMode]);

  const handleCaptureScan = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const barcode = detectBarcodeFromImage(imageData);

        if (barcode) {
          setScannedBarcodes((prev) => [...prev, barcode]);
          setToastMessage(`Scanned: ${barcode}`);
          setShowToast(true);
        } else {
          setToastMessage("No barcode detected. Try manual entry.");
          setShowToast(true);
        }
      }
    }
  };

  const handleDone = () => {
    if (scannedBarcodes.length > 0) {
      // Navigate back with scanned barcodes
      history.push({
        pathname: "/scan-flow",
        state: { scannedBarcodes },
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
              <p>Align barcode within frame</p>
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
          >
            Scan
          </IonFabButton>
        </IonFab>

        {/* Bottom-Right Done Button */}
        {scannedBarcodes.length > 0 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleDone} color="success">
              <IonIcon icon={checkmarkDoneCircle} />
              <IonText>{scannedBarcodes.length}</IonText>
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
