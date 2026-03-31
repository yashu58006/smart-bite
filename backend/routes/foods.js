const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// GET /api/foods - Fetch all food items
router.get('/', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('foods').get();
    
    const foods = [];
    snapshot.forEach(doc => {
      foods.push({ _id: doc.id, ...doc.data() });
    });
    
    res.json(foods);
  } catch (err) {
    console.error('Error fetching foods:', err);
    res.status(500).json({ message: 'Failed to fetch food items' });
  }
});

// GET /api/foods/:id - Fetch single food item
router.get('/:id', async (req, res) => {
  try {
    const db = admin.firestore();
    const doc = await db.collection('foods').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.json({ _id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('Error fetching food:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
