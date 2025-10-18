import React, { useRef, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonText,
} from "@ionic/react";
import { cameraReverse, checkmarkDoneCircle } from "ionicons/icons";
// import { saveCapturedPhotos } from '../lib/photo-storage'; // No longer needed
import { usePhotoContext } from "../context/PhotoContext";

const CameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]); // No longer managed by local state
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const history = useHistory();
  const { photos, addPhoto, setPhotos } = usePhotoContext(); // Use context here
  const [isCapturing, setIsCapturing] = useState(false); // New state to prevent rapid clicks
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounce timeout

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
      // Clear any pending capture timeout on unmount
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [facingMode]);

  const handleTakePhoto = () => {
    if (isCapturing) {
      return; // Prevent multiple captures if one is already in progress
    }

    setIsCapturing(true); // Set capturing state to true

    captureTimeoutRef.current = setTimeout(() => {
      try {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;

          // Set canvas dimensions to match video dimensions for full capture
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const context = canvas.getContext("2d");
          if (context) {
            // Draw the entire video frame onto the canvas without cropping
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL("image/jpeg");
            addPhoto(dataUrl); // Use context.addPhoto
          }
        }
      } catch (error) {
        console.error("Error taking photo:", error);
      } finally {
        setIsCapturing(false); // Reset capturing state after capture attempt (success or error)
        captureTimeoutRef.current = null; // Clear timeout ref
      }
    }, 300); // 300ms debounce period - adjust as needed
  };

  const handleDone = () => {
    // saveCapturedPhotos(capturedPhotos); // No longer needed
    history.goBack(); // Simply go back, photos are already in context
  };

  const handleBack = () => {
    setPhotos([]); // Clear photos if going back without saving
    history.goBack();
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <IonPage>
      <IonContent
        scroll-y="false"
        style={{
          "--background": "#000",
          "--padding-start": "0",
          "--padding-end": "0",
          "--padding-top": "0",
          "--padding-bottom": "0",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }} // Video will fill the 100vh container
          />

          {/* Scan Overlay */}
          <img
            src="/Scan.png"
            alt="Scan Overlay"
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%", // Adjust size as needed
              maxWidth: "300px",
              opacity: "0.7",
              pointerEvents: "none", // Allow interaction with elements behind it
            }}
          />

          {/* Top-Left Close Button */}
          <IonFab
            vertical="top"
            horizontal="start"
            slot="fixed"
            style={{ marginTop: "50px" }}
          >
            <IonFabButton onClick={handleBack} color="light" size="small">
              <img
                src="/Close.png"
                alt="Close"
                style={{ width: "24px", height: "24px" }}
              />
            </IonFabButton>
          </IonFab>

          {/* Top-Right Flip Camera Button */}
          <IonFab
            vertical="top"
            horizontal="end"
            slot="fixed"
            style={{ marginTop: "50px" }}
          >
            <IonFabButton onClick={handleFlipCamera} color="light" size="small">
              <IonIcon icon={cameraReverse} />
            </IonFabButton>
          </IonFab>

          {/* Bottom Center Take Photo Button */}
          <IonFab
            vertical="bottom"
            horizontal="center"
            slot="fixed"
            style={{ marginBottom: "100px" }}
          >
            <IonFabButton
              onClick={handleTakePhoto}
              disabled={isCapturing} // Disable button when capturing
              style={{
                "--background": "white",
                "--background-activated": "lightgray",
                "--border-color": "grey",
                "--border-style": "solid",
                "--border-width": "4px",
                "--box-shadow": "none",
                width: "70px",
                height: "70px",
                borderRadius: "50%",
              }}
            ></IonFabButton>
          </IonFab>

          {/* Bottom Right Done Button (if photos taken) */}
          {photos.length > 0 && (
            <IonFab
              vertical="bottom"
              horizontal="end"
              slot="fixed"
              style={{ marginBottom: "100px" }}
            >
              <IonFabButton onClick={handleDone} color="success">
                <IonIcon icon={checkmarkDoneCircle} />
                <IonText>{photos.length}</IonText>
              </IonFabButton>
            </IonFab>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CameraPage;
