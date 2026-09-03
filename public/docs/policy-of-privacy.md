# Silic Privacy Policy

Last updated: September 3, 2026.

---

## 1. Overview & Commitment to Privacy

**Silic** ("we", "our", or "the application") is a local-first, privacy-focused knowledge graph note-taking web application and Progressive Web App (PWA) available at [https://silic.kemlib.com](https://silic.kemlib.com).

We believe that your data belongs entirely to you. This Privacy Policy outlines how Silic handles, stores, and protects your information, as well as the rules governing our optional third-party integrations (including Google Drive™ API), in compliance with applicable data protection laws and **Google API Services User Data Policy**.

---

## 2. Information We Collect and How We Process It

### 2.1. Local Knowledge Graph Data (Local-First Architecture)

- **What data is processed:** Your notes, entities, records, attributes, connections, diagrams, templates, and project settings.
- **Where data is stored:** All user data is processed and stored **locally within your web browser's storage engines (IndexedDB and LocalStorage)**.
- **No Server Transmission:** Silic does **not** operate backend databases or centralized servers for storing your notes. Your knowledge graph data is never transmitted to, stored on, or analyzed by our servers.

### 2.2. Personal Identifiable Information (PII)

- Silic does **not** require account registration, usernames, passwords, phone numbers, or credit card information to use the application.
- We do not collect, track, or log personal identifiable information during your standard use of the app.

### 2.3. Analytics, Cookies & Tracking

- Silic does **not** use third-party tracking cookies, advertising SDKs, or behavior-tracking tools.
- Local browser storage is strictly utilized for technical operations (e.g., saving user theme preferences, UI language selections, and local database cache).

---

## 3. Google Drive™ Integration & Google User Data

Silic offers an optional feature allowing users to backup, sync, open, and save `.silic` project files to their personal Google Drive™ storage.

### 3.1. Google API Scopes Requested

When you choose to connect Google Drive™, Silic requests access via the Google OAuth 2.0 protocol using the following minimal scope:

- `https://www.googleapis.com/auth/drive.file`
  - **Scope Purpose:** View, create, edit, save, and delete _only_ the specific files and folders that you open, create, or authorize with Silic (specifically `.silic` project graph files).
  - **Limited Access:** Silic does **not** request access to your entire Google Drive™ and cannot view or access unrelated files, photos, emails, or personal documents in your Google Drive™.

### 3.2. How Google User Data Is Used

- **Saving Projects:** To export and write your local graph projects directly as `.silic` files to your Google Drive™.
- **Opening Projects:** To let you select and import your previously saved `.silic` files via the Google Drive™ Picker.
- **File Sharing:** To retrieve or generate a shareable Google Drive™ link when you explicitly choose to share your project file.

### 3.3. How Google User Data Is Transmitted and Stored

- **Direct Encryption:** All API calls and file transfers occur directly and securely over encrypted HTTPS/TLS connections between your web browser client and Google's official API endpoints (`https://www.googleapis.com`).
- **No Silic Server Relay:** Google Drive™ files, directory metadata, and OAuth tokens **never pass through, nor are they ever stored on, any intermediary servers owned or operated by Silic**.
- **Token Handling:** OAuth access tokens granted by Google are stored temporarily in browser session memory or secure local storage and are used solely to authenticate your direct requests to Google APIs.

### 3.4. No Sharing, No Sale & No AI Training

- **No Third-Party Sharing:** Silic does not transfer, disclose, share, or sell Google user data to third parties, advertising platforms, data brokers, or information resellers.
- **No AI/ML Training:** Silic does **not** use user data obtained from Google APIs to train, retrain, or improve generalized Artificial Intelligence (AI) or Machine Learning (ML) models.

### 3.5. Google API Limited Use Disclosure

> **Silic's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.**

---

## 4. User Rights and Data Control

You retain complete ownership and control over your data at all times:

1. **Local Data Management:** You can view, modify, export, or permanently erase all your locally stored notes and graph data at any time via the application interface or by clearing your browser's site data / IndexedDB storage.
2. **Google Drive™ Data Management:** You can view, rename, download, or permanently delete `.silic` files directly inside your [Google Drive™](https://drive.google.com).
3. **Revoking Google Account Access:** You can disconnect Silic from your Google Account at any time by revoking permissions in your Google Account Security settings at:  
   [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)

---

## 5. Communications & Support

If you contact the developer via email (e.g., for technical support, feature suggestions, or bug reports) or interact via GitHub, we will only use your voluntarily provided contact details (such as your email address and message contents) for the purpose of answering your inquiry and providing customer support.

---

## 6. Data Security

We implement industry-standard security practices to safeguard your information:

- All web traffic is served strictly over secure HTTPS/TLS connections.
- Strict Content Security Policy (CSP) and local sandboxing ensure that local data remains confined to your browser environment.
- Client-side architecture eliminates centralized database breaches since no centralized user data repository exists.

---

## 7. Children's Privacy

Silic is not directed toward children under 13 years of age, and we do not knowingly collect personal identifiable information from children.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or applicable regulatory requirements. Any updates will be posted on this page with an updated "Effective Date" and version number. We encourage users to periodically review this policy.

---

## 9. Contact Information

If you have any questions, feedback, or concerns regarding this Privacy Policy or our privacy practices, please contact us at:

- **Developer / Maintainer:** Helitoo
- **Email:** [bao162006@gmail.com](mailto:bao162006@gmail.com)
- **GitHub Repository:** [https://github.com/helitoo/silic](https://github.com/helitoo/silic)
- **Project Website:** [https://silic.kemlib.com](https://silic.kemlib.com)
