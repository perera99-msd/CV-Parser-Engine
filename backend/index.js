// backend/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { parseRawText } = require('./utils/regexParser');
const Resume = require('./models/Resume');
const pdf = require('pdf-parse');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Multi-part form handler storage configurations
const upload = multer({ storage: multer.memoryStorage() });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_parser')
  .then(() => console.log('MongoDB Engine Connected Successfully.'))
  .catch(err => console.error('Database connection breakdown:', err));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'CV Extract API is up and running!' });
});

// Upload & Extraction Route
app.post('/api/upload', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document target found in request payload.' });
    }

    let rawText = '';
    
    // Validate file type
    if (req.file.mimetype === 'application/pdf') {
      // Use the stable and official pdf-parse API
      const pdfData = await pdf(req.file.buffer);
      rawText = pdfData.text;
    } else {
      return res.status(415).json({ error: 'Unsupported media asset format. Please supply a PDF.' });
    }

    // Process raw string data deterministically using our regex parser
    const structuredProfile = parseRawText(rawText);

    // Persist parsed schema downstream into MongoDB
    const savedProfile = new Resume(structuredProfile);
    await savedProfile.save();

    // Transmit the fully structured JSON back to the Next.js frontend
    res.status(201).json({
      message: 'Analysis and pipeline extraction cycle complete.',
      data: savedProfile
    });
  } catch (error) {
    console.error('Core process failure:', error);
    res.status(500).json({ error: 'Internal system fault occurred during text processing.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Ingestion network engine listening on port ${PORT}`);
});