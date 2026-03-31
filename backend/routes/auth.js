const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const crypto = require('crypto');

// Simple JWT-like mock token generator since we aren't using a real JWT library yet
function generateToken(user) {
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!admin.apps.length) {
      return res.status(500).json({ message: 'Firebase not configured' });
    }

    const db = admin.firestore();
    const usersRef = db.collection('users');
    
    // Check if user exists
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password simply
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const newUser = {
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await usersRef.add(newUser);
    const user = { id: docRef.id, name, email, isAdmin: false };
    
    res.json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!admin.apps.length) {
      return res.status(500).json({ message: 'Firebase not configured' });
    }

    const db = admin.firestore();
    const usersRef = db.collection('users');
    
    const snapshot = await usersRef.where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (userData.password !== hashedPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = { id: userDoc.id, name: userData.name, email: userData.email, isAdmin: userData.isAdmin };
    res.json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
