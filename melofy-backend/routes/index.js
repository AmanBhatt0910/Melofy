const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const songController = require('../controllers/songController');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.webm', '.mp4', '.aiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      return cb(null, true);
    }
    
    cb(new Error(`Unsupported file type. Please upload one of these formats: ${allowedExtensions.join(', ')}`));
  },
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1
  }
});

router.post('/songs', upload.single('audio'), songController.addSong);
router.get('/songs', songController.listSongs);
router.get('/songs/:id', songController.getSong);
router.delete('/songs/:id', songController.deleteSong);

router.post('/recognize', upload.single('audio'), songController.recognizeSong);

router.post('/test-upload', upload.single('audio'), (req, res) => {
  res.json({
    message: 'File uploaded successfully for testing',
    file: req.file
  });
});

module.exports = router;