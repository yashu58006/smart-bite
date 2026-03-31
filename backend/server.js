require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');

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
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    await autoSeed();
  }
});

// ======= Auto-Seed for Admin & Menu =======
async function autoSeed() {
  const db = admin.firestore();
  
  try {
    // 1. Seed Admin
    const adminEmail = 'admin@smartfood.com';
    const userSnapshot = await db.collection('users').where('email', '==', adminEmail).get();
    
    if (userSnapshot.empty) {
      const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
      await db.collection('users').add({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`👤 Created Default Admin: ${adminEmail} (pass: admin123)`);
    }

    // 2. Seed Menu if empty
    const foodsSnapshot = await db.collection('foods').limit(1).get();
    if (foodsSnapshot.empty) {
      const sampleFoods = [
        { name: 'Paneer Butter Masala', price: 280, category: 'Main Course', image: '🥘', description: 'Creamy paneer in tomato gravy', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400' },
        { name: 'Margherita Pizza', price: 299, category: 'Pizza', image: '🍕', description: 'Classic cheese and tomato', imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?auto=format&fit=crop&q=80&w=400' },
        { name: 'Butter Chicken', price: 350, category: 'Main Course', image: '🍗', description: 'Tender chicken in rich makhani sauce', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400' },
        { name: 'Cheese Lava Burger', price: 189, category: 'Burgers', image: '🍔', description: 'Double patty with oozing cheese', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400' },
        { name: 'White Sauce Pasta', price: 220, category: 'Pasta', image: '🍝', description: 'Creamy Alfredo penne with veggies', imageUrl: 'https://images.unsplash.com/photo-1645112481338-3560e99815fe?auto=format&fit=crop&q=80&w=400' },
        { name: 'Mango Lassi', price: 90, category: 'Beverages', image: '🥛', description: 'Yogurt based mango drink', imageUrl: 'https://images.unsplash.com/photo-1528664155601-526487e6576d?auto=format&fit=crop&q=80&w=400' }
      ];
      for (const food of sampleFoods) {
        await db.collection('foods').add({ ...food, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      console.log('✨ Menu Auto-Seeded with 6 sample items');
    }
  } catch (err) {
    console.error('❌ Auto-Seed Error:', err.message);
  }
}
