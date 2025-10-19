# FitcheckBU

## Overview

FitcheckBU is a mobile-first inventory management application for secondhand clothing sellers, built using the Ionic React framework. The app enables users to upload clothing images, automatically analyze them using Google Cloud Vision API, and manage their inventory. The application supports both web and native mobile platforms through Capacitor, with a focus on providing a streamlined experience for cataloging and selling vintage/secondhand fashion items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & UI Library**
- **Ionic React v8.5**: Chosen as the primary UI framework to provide native-like mobile experiences with web technologies
- **React 19**: Modern React version with latest features and performance improvements
- **TypeScript**: Strict typing enabled for type safety and better developer experience
- **Vite**: Build tool for fast development and optimized production builds

**Routing & Navigation**
- **React Router v5**: Client-side routing with React Router DOM
- **Ionic Router**: Integration layer between Ionic and React Router for mobile navigation patterns
- **Tab-based Navigation**: Primary navigation structure using IonTabs with Home, Upload, and Dashboard routes

**State Management**
- Local component state using React hooks (useState, useEffect)
- Real-time Firestore listeners for inventory synchronization
- Session-based upload tracking using refs to prevent memory leaks

**Mobile Capabilities**
- **Capacitor v7**: Native runtime for deploying to iOS/Android
- Plugins: App, Haptics, Keyboard, Status Bar for native device features
- Progressive Web App (PWA) support with manifest.json

### Backend Architecture

**Firebase Services**
- **Firebase Authentication**: User authentication and authorization (configured but implementation in progress)
- **Cloud Firestore**: NoSQL document database for inventory items
  - Collection: `items` storing InventoryItem documents
  - Real-time listeners for live updates
  - Server-side timestamps for data consistency
- **Cloud Storage**: Image storage with path structure `uploads/{sessionId}/{fileName}`
- **Cloud Functions v2**: Serverless backend processing (Node.js 22 runtime)

**Image Processing Pipeline**
- **Google Cloud Vision API**: Automatic image analysis and labeling
- **Batch Upload Pattern**: Groups multiple images by sessionId for efficient processing
- **Delayed Processing**: 5-second delay after upload to ensure GCS replication before Vision API analysis
- **Session Tracking**: In-memory tracking of related images within upload sessions

**Data Model**
```typescript
InventoryItem {
  id: string (Firestore document ID)
  name: string
  category: string
  brand: string
  color: string
  condition: string
  price: number
  decade: string
  style: string
  isSold: boolean
  dateAdded: Timestamp
  sessionId: string (upload session identifier)
  imageStoragePaths: string[] (Cloud Storage paths)
  labels: string[] (Vision API generated tags)
  description?: string (optional)
}
```

### Application Features

**Upload Flow**
1. User selects multiple images via file input
2. Images previewed locally with size validation
3. Single upload action triggers batch upload to Cloud Storage
4. Cloud Function monitors uploads by session
5. Vision API analyzes images and extracts labels
6. Firestore document created with metadata and Vision labels
7. Real-time listener updates UI with processed item

**Inventory Management**
- Dashboard view with search and filter capabilities
- Filter by: sizes, sexes, colors, materials
- Item detail modal with full image gallery
- Mark items as sold functionality
- Pull-to-refresh for data synchronization

**Responsive Design**
- Mobile-first approach with Ionic components
- Dark mode support via CSS system preference detection
- Figma-aligned styling for consistent brand experience

### Testing Strategy

**Unit Testing**
- Vitest for component and service testing
- React Testing Library for component interaction tests
- JSDOM environment for DOM simulation
- Coverage reporting with v8

**E2E Testing**
- Cypress for end-to-end testing
- Base URL: localhost:5173 (Vite dev server)

**Quality Assurance**
- ESLint 9 with flat config
- TypeScript strict mode
- Prettier for code formatting
- Husky for pre-commit hooks

### Build & Deployment

**Development**
- Vite dev server with HMR
- `--host` flag for mobile device testing on local network
- Firebase emulators for local Cloud Functions testing

**Production**
- TypeScript compilation + Vite production build
- Legacy browser support via @vitejs/plugin-legacy
- Vercel deployment with SPA routing configuration
- Firebase Functions deployment to us-east1 region

## External Dependencies

### Third-Party Services

**Google Cloud Platform**
- **Cloud Vision API v5.3.4**: Image content analysis, object detection, and label generation
- Credentials managed through Firebase Admin SDK
- Regional deployment: us-east1

**Firebase (v12.3.0)**
- Authentication: User management and session handling
- Firestore: Real-time NoSQL database with optional database ID configuration
- Cloud Storage: Image and asset storage
- Cloud Functions: Serverless compute for background processing
- Admin SDK v13.5.0 for privileged server-side operations

### NPM Packages

**Core Dependencies**
- `ionicons` v7.4.0: Icon library
- `uuid` v13.0.0: Session ID generation
- `react-router`/`react-router-dom` v5.3.4: Client routing

**Development Tools**
- `eslint` v9.37.0 with TypeScript support
- `cypress` v13.17.0: E2E testing framework
- `vitest` v3.2.4: Unit testing with coverage
- `firebase-functions-test` v3.1.0: Cloud Functions testing utilities

### Configuration Requirements

**Environment Variables**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIRESTORE_DATABASE_ID (optional)
VITE_FIREBASE_MEASUREMENT_ID (optional)
VITE_FIREBASE_DATABASE_URL (optional)
```

**Firebase Functions Parameters**
- `FIRESTORE_DATABASE_ID`: Optional Firestore database identifier for multi-database setups

### Browser Compatibility
- Modern browsers with ES2022 support
- Legacy browser support through polyfills
- Mobile Safari and Chrome optimized