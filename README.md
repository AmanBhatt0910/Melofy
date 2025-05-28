```markdown
# 🎵 Melofy - A Real-Time Music Recognition System

Melofy is a full-stack web application that enables users to identify music tracks in real-time using advanced audio fingerprinting techniques. Inspired by Shazam, Melofy allows users to upload audio clips, analyze and recognize songs, manage song history, and explore a sleek, responsive interface.

---

## 🔧 Tech Stack

### Frontend
- **Framework:** Next.js 15
- **UI & Styling:** Tailwind CSS, Framer Motion, Lucide React, React Icons
- **Audio Tools:** Wavesurfer.js
- **3D/Visual Effects:** @react-three/fiber, Drei, Maath
- **State & Data Handling:** Axios, React 19

### Backend
- **Server:** Node.js + Express 5
- **Database:** MongoDB via Mongoose
- **Audio Processing:** Fourier Transform, Pitchfinder, Web Audio API
- **Storage:** Multer for file handling
- **Security & Middleware:** CORS, body-parser, dotenv

---

## 📁 Folder Structure

### Frontend (`/melofy-frontend`)
```

public/
src/
├── app/
│   ├── about/
│   ├── history/
│   ├── manager/
│   ├── settings/
│   └── layout.js, page.js
├── components/
│   ├── common/
│   ├── effects/
│   ├── media/
│   ├── music/
│   ├── sections/
│   └── ui/
│   ├── AudioProcessing.jsx
│   ├── SongCard.jsx
│   ├── ProcessingIndicator.jsx
│   └── SearchBar.jsx

```

### Backend (`/melofy-backend`)
```

config/
controllers/
middlewares/
models/
routes/
temp/
utils/
.env
server.js

````

---

## 🚀 Features

- 🎶 **Music Recognition:** Upload an audio clip to identify the song in real-time.
- 🧠 **Audio Fingerprinting:** Uses Fourier transforms and pitch detection to extract unique audio hashes.
- 📊 **History Management:** View recognized songs with time and metadata.
- 🔒 **Authentication:** Basic user authentication and route protection.
- 🌐 **Responsive UI:** Seamless experience across devices using modern frontend libraries.

---

## 🧪 Testing Strategies

### ✅ Manual UI Testing
- Interacted with all key UI flows like uploading, recognition, settings, and history.
- Verified responsiveness, hover effects, animations, and button functionalities.

### ✅ Chrome DevTools
- Used Chrome DevTools for inspecting DOM, debugging React components, and analyzing network requests.

### ✅ API Testing via Postman
- Tested core API endpoints:
  - `POST /upload`
  - `GET /recognize`
  - `GET /history`
  - `POST /auth/login`
- Validated status codes, responses, error messages, and file handling.

### ✅ Audio Recognition Testing
- Verified audio hashing and matching logic using controlled input.
- Debugged fingerprinting output from `AudioProcessing.js`.

### ✅ Validation & Edge Case Testing
- Tested empty uploads, invalid formats, long/silent audio, and server unavailability.
- Verified proper error messages and fail-safes.

---

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/AmanBhatt0910/Melofy.git
cd melofy
````

### 2. Setup Backend

```bash
cd melofy-backend
npm install
# Configure your `.env` file
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Create a `.env` file in the backend with the following:

```
PORT=5000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
```

---

## 👥 Contributors

* Aman bhatt – [@amanbhatt0910](https://github.com/AmanBhatt0910/Melofy.git)

---

## 📌 Acknowledgements

* Shazam (for inspiration)
* open-source libraries used in this project (wavesurfer.js, pitchfinder, maath, etc.)

```