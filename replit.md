# FitcheckBU

## Overview

FitcheckBU is a mobile-first inventory management application for fashion items, built with Ionic React and Firebase. The application enables users to photograph clothing items, upload them to cloud storage, and automatically analyze them using Google Cloud Vision API. The system generates detailed metadata about fashion items including category, brand, color, condition, and style tags, creating a searchable digital inventory for fashion resale or personal collection management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Choice: Ionic React**
- **Problem**: Need a cross-platform mobile application that works on iOS, Android, and web with a single codebase
- **Solution**: Ionic React with Capacitor for native mobile capabilities
- **Rationale**: Provides native-like UI components, access to device features (camera, storage), and seamless deployment across platforms
- **Trade-offs**: Slightly less performant than native apps, but significantly faster development cycle

**State Management: React Hooks**
- **Problem**: Managing component state and side effects for file uploads and real-time data
- **Solution**: Built-in React hooks (useState, useEffect, useRef) for local component state
- **Rationale**: Sufficient for current application complexity; avoids overhead of external state management libraries
- **Trade-offs**: May need Redux or Zustand if state sharing across components becomes complex

**Routing: React Router v5**
- **Problem**: Navigation between Upload and Home pages
- **Solution**: React Router DOM v5 with Ionic's router integration
- **Rationale**: Industry standard for React applications, well-integrated with Ionic
- **Trade-offs**: Using older v5 instead of v6 for Ionic compatibility

**Build System: Vite**
- **Problem**: Fast development experience and optimized production builds
- **Solution**: Vite with React plugin and legacy browser support
- **Rationale**: Significantly faster hot module replacement than webpack, modern ESM-based architecture
- **Trade-offs**: Requires polyfills for older browsers (handled via @vitejs/plugin-legacy)

### Backend Architecture

**Serverless Functions: Firebase Cloud Functions**
- **Problem**: Need server-side processing for image analysis without managing infrastructure
- **Solution**: Firebase Cloud Functions (v2) with TypeScript
- **Rationale**: Serverless architecture scales automatically, integrates seamlessly with Firebase ecosystem
- **Trade-offs**: Cold start latency, vendor lock-in to Firebase

**Image Processing Pipeline**
- **Problem**: Analyze uploaded fashion photos to extract metadata automatically
- **Solution**: Cloud Functions trigger on Storage object finalization, invoke Google Cloud Vision API for label detection
- **Architecture Flow**:
  1. User uploads images to Firebase Storage (`uploads/{sessionId}/{filename}`)
  2. Cloud Function `onBatchImageUpload` triggers on file creation
  3. Session tracking accumulates related images (currently set to 1 image minimum)
  4. After 5-second delay (for GCS replication), Vision API analyzes images
  5. Results written to Firestore as inventory items
- **Rationale**: Event-driven architecture ensures processing happens automatically without client polling
- **Trade-offs**: 5-second artificial delay to avoid race conditions; could be optimized with better state management

**Session-Based Upload Tracking**
- **Problem**: Group multiple images from a single upload session together
- **Solution**: In-memory session tracker using UUID-based session IDs
- **Rationale**: Lightweight approach for MVP; allows batch processing of related images
- **Trade-offs**: Sessions lost on function cold starts; should migrate to Firestore or Redis for production

### Data Storage

**Primary Database: Cloud Firestore**
- **Problem**: Store inventory items with real-time sync capabilities
- **Solution**: Firestore NoSQL database with optional custom database ID support
- **Schema Design**:
  - Collection: `items`
  - Document structure: InventoryItem interface with metadata (name, category, brand, color, condition, price, decade, style, labels, etc.)
  - Includes Vision API labels, storage paths, session IDs, and timestamps
- **Rationale**: Real-time updates enable instant UI feedback; NoSQL structure accommodates evolving fashion metadata schema
- **Trade-offs**: No relational queries; must denormalize data for complex queries

**File Storage: Firebase Cloud Storage**
- **Problem**: Store uploaded fashion photographs securely and scalably
- **Solution**: Firebase Storage with organized path structure (`uploads/{sessionId}/{filename}`)
- **Rationale**: Integrated with Firebase Auth for security rules, CDN-backed for fast image delivery
- **Trade-offs**: Costs scale with storage and bandwidth; no built-in image optimization

**Real-Time Data Sync**
- **Problem**: Update UI immediately when Cloud Functions complete image analysis
- **Solution**: Firestore real-time listeners (onSnapshot) in React components
- **Rationale**: Provides seamless user experience without manual refresh
- **Trade-offs**: Increased read operations cost; potential memory leaks if listeners not cleaned up properly

### Authentication & Authorization

**Authentication: Firebase Authentication**
- **Problem**: Secure user accounts and data access
- **Solution**: Firebase Auth SDK integrated in frontend
- **Current State**: Infrastructure configured but authentication flow not yet implemented
- **Rationale**: Supports multiple auth providers, integrates with Firestore security rules
- **Trade-offs**: Vendor lock-in; requires careful security rule configuration

### External Dependencies

**Google Cloud Vision API**
- **Purpose**: Automatic image analysis for fashion item categorization and labeling
- **Integration**: Called from Cloud Functions using `@google-cloud/vision` SDK
- **Authentication**: Service account credentials (managed by Firebase/GCP)
- **Features Used**: Label detection for identifying clothing attributes
- **Rationale**: Industry-leading computer vision accuracy for object and attribute recognition

**Firebase Platform**
- **Services Used**:
  - Authentication (configured, not yet active)
  - Cloud Firestore (primary database)
  - Cloud Storage (image storage)
  - Cloud Functions (serverless backend)
- **Authentication**: Environment variables for client SDK, service accounts for admin SDK
- **Rationale**: Fully integrated platform reduces operational complexity

**Capacitor Native Bridge**
- **Purpose**: Access native device features (camera, file system, status bar, haptics, keyboard)
- **Plugins Used**: @capacitor/app, @capacitor/core, @capacitor/haptics, @capacitor/keyboard, @capacitor/status-bar
- **Rationale**: Provides consistent API for native features across iOS and Android

**Development & Testing Tools**
- **Testing**: Vitest for unit tests, Testing Library for component tests, Cypress for E2E tests
- **Linting**: ESLint 9 with flat config, TypeScript ESLint, React plugins
- **Formatting**: Prettier with Husky pre-commit hooks
- **Rationale**: Comprehensive testing and code quality tooling ensures maintainability

**Deployment**
- **Hosting**: Configured for Vercel with SPA fallback routing
- **Mobile**: Capacitor builds for iOS/Android app stores
- **Rationale**: Multi-platform deployment from single codebase