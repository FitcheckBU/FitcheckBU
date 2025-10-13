import * as functions from "firebase-functions";

// This is a simple test function
export const helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase Functions!");
});
