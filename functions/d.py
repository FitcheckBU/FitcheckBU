"""All Video Intelligence API features run on a video stored on GCS."""
from google.cloud import videointelligence

import time

gcs_uri = "gs://automatic-map-473619-b7.firebasestorage.app/uploads/351162b2-2e1e-46d8-a791-921f688c84c5/IMG_5315.MOV"
output_uri = "gs://automatic-map-473619-b7.firebasestorage.app/uploads/351162b2-2e1e-46d8-a791-921f688c84c5/output - {}.json".format(time.time())

video_client = videointelligence.VideoIntelligenceServiceClient.from_service_account_file(
    "/Users/marcuschang/Desktop/2025FallClasses/XC475/FitcheckBU/automatic-map-473619-b7-firebase-adminsdk-fbsvc-b9ac9f3c28.json")

features = [
    videointelligence.Feature.OBJECT_TRACKING,
    videointelligence.Feature.LABEL_DETECTION,
    videointelligence.Feature.SHOT_CHANGE_DETECTION,
    videointelligence.Feature.SPEECH_TRANSCRIPTION,
    videointelligence.Feature.LOGO_RECOGNITION,
    videointelligence.Feature.EXPLICIT_CONTENT_DETECTION,
    videointelligence.Feature.TEXT_DETECTION,
    videointelligence.Feature.FACE_DETECTION,
    videointelligence.Feature.PERSON_DETECTION
]

transcript_config = videointelligence.SpeechTranscriptionConfig(
    language_code="en-US", enable_automatic_punctuation=True
)

person_config = videointelligence.PersonDetectionConfig(
    include_bounding_boxes=True,
    include_attributes=False,
    include_pose_landmarks=True,
)

face_config = videointelligence.FaceDetectionConfig(
    include_bounding_boxes=True, include_attributes=True
)


video_context = videointelligence.VideoContext(
    speech_transcription_config=transcript_config,
    person_detection_config=person_config,
    face_detection_config=face_config)

operation = video_client.annotate_video(
    request={"features": features,
             "input_uri": gcs_uri,
             "output_uri": output_uri,
             "video_context": video_context}
)

print("\nProcessing video.", operation)

result = operation.result(timeout=300)

print("\n finnished processing.")

# print(result)