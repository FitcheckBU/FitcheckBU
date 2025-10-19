# FitcheckBU 🌿

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
    Follow the instructions for your operating system: - **macOS (Homebrew)**:
    `bash
        brew install mkcert
        brew install nss # if using Firefox
        ` - **Windows (Chocolatey)**:
    `bash
        choco install mkcert
        choco install nss # if using Firefox
        ` - **Linux (apt)**:
    `bash
        sudo apt install mkcert
        sudo apt install libnss3-tools # if using Firefox
        `

    b. **Install local CA**:
    `bash
    mkcert -install
    `

    c. **Generate Certificates**:
    Generate certificates for `localhost` and your local IP address. Make sure to replace `YOUR_LOCAL_IP_ADDRESS` with your actual local IP (e.g., `192.168.1.x`).
    `bash
    mkcert localhost YOUR_LOCAL_IP_ADDRESS
    `
    This will create `localhost+1.pem` (certificate) and `localhost+1-key.pem` (private key) files in the directory where you run the command.

4.  **Run the Application**: Start the development server.

    ```bash
    npm run dev
    ```

    - To access the app from a phone on the same network, start the dev server with `npm run dev -- --host` and open the shown network URL on your device. The `host: '0.0.0.0'` in `vite.config.ts` makes it accessible on the network.
