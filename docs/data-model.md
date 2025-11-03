# Firestore Data Model

## `items` collection

Each document in `items` represents a single inventory entry. Fields are stored as the types listed below.

| Field               | Type                 | Description                                                                                 | Populated by               |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| `name`              | `string`             | Human readable title the team assigns to the garment.                                       | App client                 |
| `description`       | `string`             | Optional description; defaults to empty string and may be filled by staff or Vision labels. | App client / Cloud Vision  |
| `category`          | `string`             | High-level grouping (e.g. `tops`, `outerwear`).                                             | App client                 |
| `brand`             | `string`             | Brand label shown in the listing.                                                           | App client                 |
| `color`             | `string`             | Primary color descriptor (e.g. `navy`).                                                     | App client / derived rules |
| `size`              | `string`             | Size as displayed to shoppers (e.g. `M`, `28x30`).                                          | App client / derived rules |
| `condition`         | `string`             | Quality description such as `new`, `good`, or `vintage`.                                    | App client / derived rules |
| `price`             | `number`             | List price in dollars.                                                                      | App client                 |
| `decade`            | `string`             | Optional era tag (e.g. `1990s`).                                                            | App client                 |
| `style`             | `string`             | Style descriptor (e.g. `streetwear`, `formal`).                                             | App client                 |
| `labels`            | `string[]`           | Tags returned from Cloud Vision for recent uploads; stored as an empty array by default.    | Cloud Vision               |
| `labelText`         | `string`             | OCR transcription of the garment’s label/tag captured from the label photo.                 | Cloud Vision               |
| `sessionId`         | `string`             | Upload session identifier linking Storage uploads to the document.                          | App client                 |
| `imageStoragePaths` | `string[]`           | Storage paths for session photos (legacy flat list).                                        | App client                 |
| `images`            | `object[]`           | Structured photo metadata `{role, storagePath, originalName}` for front/back/label shots.   | App client                 |
| `isSold`            | `boolean`            | Inventory availability flag.                                                                | App client                 |
| `dateAdded`         | `firebase.Timestamp` | Server-set timestamp of when the document was created.                                      | Firestore                  |

`role` currently aligns with the upload flow sequence (`front`, `back`, `label`) so downstream services can distinguish which photo to use for OCR or listings.

> Tip: When adding new optional metadata (e.g. `notes`, `material`), update both this document and the `InventoryItem` interface (`src/lib/inventoryService.ts`) to keep Firestore data in sync with the app types.
