require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();

// Initialize Firebase if credentials are provided
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized");
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
  }
} else {
  console.warn("No FIREBASE_SERVICE_ACCOUNT provided. Firebase will not work.");
}

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// API 404 Handler - Returns JSON instead of HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.originalUrl} not implemented` });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
