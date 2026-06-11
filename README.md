# 📄 ResuMap (CV Parsing Engine)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

An end-to-end, deterministic CV extraction system that processes unstructured PDF documents and converts them into standardized, predictable JSON profiles. 

Unlike standard NLP or AI wrappers, this engine utilizes a custom-built **State Machine and Heuristic Regex Pipeline** to intelligently bucket, stitch, and structure document data regardless of layout variations.

## ✨ Key Features
* **Binary Ingestion:** Secure PDF file uploads utilizing `multer` memory storage.
* **Raw Text Extraction:** Accurate text-layer stripping using `pdf-parse`.
* **State-Machine Parsing:** Advanced look-ahead and look-behind logic to handle broken lines, invisible tables, and dynamic formatting without relying on third-party AI APIs.
* **Structured Persistence:** Strict validation and data modeling via Mongoose/MongoDB.
* **Instant Visual Recreation:** A responsive Next.js frontend that instantly maps the extracted JSON into a clean, standardized dashboard view.

## 🏗️ System Architecture

1.  **Client:** Next.js application handles file selection and wraps binary data in `FormData`.
2.  **API Gateway:** Node.js/Express endpoint (`/api/upload`) intercepts the payload.
3.  **Extraction Layer:** Binary buffer is converted to raw text. Artifacts and invisible PDF layout breaks are aggressively sanitized.
4.  **Parsing Engine:**
    *   *Phase 1:* Metadata extraction (Emails, International Phone formatting).
    *   *Phase 2:* Contextual Bucket Sorting (allocating lines to Summary, Skills, Projects, etc.).
    *   *Phase 3:* Array Re-stitching (fixing multi-line bullet points and missing headers).
5.  **Database:** Clean data is saved to MongoDB.

## 💻 Tech Stack
* **Frontend:** React, Next.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Utilities:** `multer`, `pdf-parse`

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* MongoDB (Local instance or Atlas URI)

### Backend Configuration
```bash
cd backend
npm install