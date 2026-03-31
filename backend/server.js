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

// Serve static frontend files first to allow dashboard.html etc to be found
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API Routes Block
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/auth'));
apiRouter.use('/foods', require('./routes/foods'));
apiRouter.use('/orders', require('./routes/orders'));
apiRouter.use('/admin', require('./routes/admin'));

// API 404 handler (Catch-all for missing API routes)
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `API Route ${req.originalUrl} does not exist` });
});

app.use('/api', apiRouter);

// Catch-all for HTML pages (SPA Fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
