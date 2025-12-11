import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonPage,
  IonText,
} from "@ionic/react";
import { cameraReverse, checkmarkDoneCircle } from "ionicons/icons";
import { PHOTO_STAGES, PhotoRole } from "../constants/photoStages";
import { usePhotoContext } from "../context/PhotoContext";
import "../styles/pages/CameraPage.css";

const isPhotoRole = (value: string | null): value is PhotoRole =>
  Boolean(value && PHOTO_STAGES.some((stage) => stage.role === value));

const parseRoleQueue = (search: string): PhotoRole[] => {
  const params = new URLSearchParams(search);
  const rolesParam = params.get("roles");
  if (rolesParam) {
    const roles = rolesParam
      .split(",")
      .map((token) => token.trim())
      .filter(isPhotoRole);
    if (roles.length > 0) {
      return roles;
    }
  }

  const singleRoleParam = params.get("role");
  if (isPhotoRole(singleRoleParam)) {
    return [singleRoleParam];
  }

  return PHOTO_STAGES.map((stage) => stage.role);
};

const CameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const history = useHistory();
  const location = useLocation();
  const { photos, addPhoto, setPhotos } = usePhotoContext();
  const [isCapturing, setIsCapturing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roleQueue = useMemo(
    () => parseRoleQueue(location.search),
    [location.search],
  );

  useEffect(() => {
    setStageIndex(0);
  }, [roleQueue]);

  const activeRole = roleQueue[stageIndex];
  const stageMeta = activeRole
    ? PHOTO_STAGES.find((stage) => stage.role === activeRole)
    : undefined;
  const sequenceComplete =
    roleQueue.length > 0 && stageIndex >= roleQueue.length;

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
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
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [facingMode]);

  const handleTakePhoto = () => {
    if (isCapturing || sequenceComplete) {
      return;
    }

    setIsCapturing(true);

    captureTimeoutRef.current = setTimeout(() => {
      try {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL("image/jpeg");
            addPhoto(dataUrl);
            setStageIndex((prev) => Math.min(prev + 1, roleQueue.length));
          }
        }
      } catch (error) {
        console.error("Error taking photo:", error);
      } finally {
        setIsCapturing(false);
        captureTimeoutRef.current = null;
      }
    }, 300);
  };

  const handleDone = () => {
    history.goBack();
  };

  const handleBack = () => {
    setPhotos([]);
    history.goBack();
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takeButtonDisabled = isCapturing || sequenceComplete;

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

          {stageMeta && !sequenceComplete ? (
            <div className="camera-stage-callout">
              <IonText color="light">
                <p className="camera-stage-step">
                  Step {stageIndex + 1} of {roleQueue.length}
                </p>
                <h2>{stageMeta.title}</h2>
                <p>{stageMeta.helper}</p>
              </IonText>
            </div>
          ) : sequenceComplete ? (
            <div className="camera-stage-callout">
              <IonText color="light">
                <p className="camera-stage-step">
                  All requested photos captured
                </p>
                <h2>Great work!</h2>
                <p>Tap Done to return to the upload flow.</p>
              </IonText>
            </div>
          ) : null}
        </div>

        <IonFab vertical="top" horizontal="start" slot="fixed">
          <IonFabButton onClick={handleBack} color="light" size="small">
            <img src="/close.svg" alt="Close" className="close-button-icon" />
          </IonFabButton>
        </IonFab>

        <IonFab vertical="top" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleFlipCamera} color="light" size="small">
            <IonIcon icon={cameraReverse} />
          </IonFabButton>
        </IonFab>

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton
            onClick={handleTakePhoto}
            disabled={takeButtonDisabled}
            className="take-photo-button"
          ></IonFabButton>
        </IonFab>

        {photos.length > 0 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleDone} color="success">
              <IonIcon icon={checkmarkDoneCircle} />
              <IonText>{photos.length}</IonText>
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CameraPage;
