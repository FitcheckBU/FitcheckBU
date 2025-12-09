# FitcheckBU 🌿

## Problem & Solution

**Problem**: Currently, the average American throws away 81 pounds of clothes a year. One of the best ways to combat this is to buy second-hand. However, interviews with shoppers reveal that second-hand shopping is currently expensive in both time and money. Clearly, buying clothes second-hand is not easy. As a result, very few people are willing to stop the waste—but now we have another option.

**Solution**: **Fitcheck** and **Fitcheck.nest** completely digitize the in-person thrifting experience.

- **Fitcheck** makes it extremely easy for even the busiest and most picky shoppers to choose sustainability with live stocks of clothes in second-hand stores nearby. The inventory even supports business owners.
- **Fitcheck.nest**, built for the owners and operators of thrift stores, streamlines tagging, pricing, and tracking of new inventory.

## Primary Target Audience

- **Fitcheck**: Designed for any sustainable consumer—whether you thrift often, feel intimidated by it, or simply want to reduce waste. Now, your pains of time wasted, hesitancy, guilt, and more are gone, easily empowering adults to thrift.
- **Fitcheck.nest**: Our .nest platform targets thrift store owners, managers, and floor employees. The .nest dashboard streamlines scanning, tagging, uploading, and even selling clothes—so our users can keep the earth green with as little hassle as possible.

## Architecture Overview

Fitcheck is a cross-platform mobile application designed for efficient inventory management and thrift store exploration. It leverages the **Ionic** framework with **React** to provide a native-like experience on both web and mobile platforms (iOS/Android) via **Capacitor**.

The application adopts a **Serverless Architecture** using **Firebase** for backend services, ensuring scalability and real-time data synchronization.

### Tech Stack

- **Frontend Framework**: React 19, Ionic 8
- **Language**: TypeScript
- **Build Tool**: Vite 5
- **Native Runtime**: Capacitor 7
- **State Management**: React Context & Hooks
- **Routing**: React Router 5
- **Maps**: Leaflet / React-Leaflet
- **Testing**: Vitest (Unit), Cypress (E2E)
- **Styling**: CSS Modules, Ionic Utilities

### Backend Services (Firebase)

- **Firestore**: NoSQL database for storing inventory items, user sessions, and store data.
- **Cloud Storage**: Stores high-resolution images of inventory items (Front, Back, Label views).
- **Cloud Functions**: Handles backend logic such as OCR processing (via Google Cloud Vision) to extract text from label images automatically.
- **Hosting**: Application hosting (Frontend also deployable via Vercel).

### Deployment

- **Frontend**: Vercel (CD configured via `vercel.json`) or Firebase Hosting.
- **Backend**: Firebase (Firestore, Functions, Storage).

## Project Structure

The project follows a standard React/Ionic structure:

- `src/components/`: Reusable UI components (e.g., `ItemCard`, `FilterSheet`, `ThriftStoreMap`).
- `src/pages/`: Application views/screens (e.g., `Home`, `Dashboard`, `CameraPage`).
- `src/lib/`: Core services and utilities:
  - `firebaseClient.ts`: Firebase initialization and configuration.
  - `inventoryService.ts`: Firestore CRUD operations.
  - `printerService.ts`: Integration with the barcode printing API.
  - `metadataParser.ts`: Logic to parse attributes (size, color, material) from OCR labels.
- `src/context/`: React Context providers (e.g., `PhotoContext` for managing camera state).
- `functions/`: Firebase Cloud Functions (TypeScript) for backend processing.
- `cypress/`: End-to-end tests.

### Key Features

- **Inventory Management**: Full CRUD capabilities for tracking clothing items.
- **Smart Camera**: Specialized camera flow to capture standardized product shots.
- **Automated Tagging**: Uses OCR (Google Cloud Vision) to automatically extract brand, size, and material from label photos.
- **Thrift Store Map**: Interactive map (Leaflet) to locate thrift stores with proximity filtering.
- **Barcode Printing**: Integration with a dedicated printing service for item tagging.
- **Offline Support**: PWA capabilities for varying network conditions.

## Getting Started

To get started with the FitcheckBU application, follow these steps:

1.  **Install Dependencies**: Install the required Node.js packages.

    ```bash
    npm install
    ```

2.  **Configure Firebase**: Create a `.env` file in the root directory of the project and add your Firebase credentials.

    ```
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    ```

3.  **Enable HTTPS for Local Development (Optional but Recommended)**:
    For camera access on mobile devices and other secure features, it's required to run the development server with HTTPS. We use `mkcert` for locally trusted development certificates.

    a. **Install `mkcert`**:
    Follow the instructions for your operating system:
    - **macOS (Homebrew)**:
      ```bash
      brew install mkcert
      brew install nss # if using Firefox
      ```
    - **Windows (Chocolatey)**:
      ```bash
      choco install mkcert
      choco install nss # if using Firefox
      ```
    - **Linux (apt)**:
      ```bash
      sudo apt install mkcert
      sudo apt install libnss3-tools # if using Firefox
      ```

    b. **Install local CA**:

    ```bash
    mkcert -install
    ```

    c. **Generate Certificates**:
    Generate certificates for `localhost` and your local IP address. Make sure to replace `YOUR_LOCAL_IP_ADDRESS` with your actual local IP (e.g., `192.168.1.x`).

    ```bash
    mkcert localhost YOUR_LOCAL_IP_ADDRESS
    ```

    This will create `localhost+1.pem` (certificate) and `localhost+1-key.pem` (private key) files in the directory where you run the command.

4.  **Run the Application**: Start the development server.

    ```bash
    npm run dev
    ```

    - To access the app from a phone on the same network, start the dev server with `npm run dev -- --host` and open the shown network URL on your device.

## Data Model

- See `docs/data-model.md` for the canonical Firestore schema used by the app (fields, types, and sources).
