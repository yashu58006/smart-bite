const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Middleware to verify token and attach user to request
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // In a production app, we would verify the Firebase token here.
    // For this implementation, we will decode it (or rely on simple metadata if using custom auth)
    // Here we'll just check if it exists.
    req.userId = 'user_id_placeholder'; // In real app, get from firebase verification
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/orders/my - Get current user's orders
router.get('/my', verifyToken, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('orders')
      // .where('userId', '==', req.userId) // filter in real app
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ _id: doc.id, ...doc.data() });
    });
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

// POST /api/orders - Place a new order
router.post('/', verifyToken, async (req, res) => {
  const { items, totalAmount, deliveryAddress } = req.body;
  
  if (!items || !totalAmount || !deliveryAddress) {
    return res.status(400).json({ message: 'Missing order details' });
  }

  try {
    const db = admin.firestore();
    const newOrder = {
      items,
      totalAmount,
      deliveryAddress,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: req.userId 
    };

    const docRef = await db.collection('orders').add(newOrder);
    res.status(201).json({ 
      message: 'Order placed successfully', 
      order: { _id: docRef.id, ...newOrder } 
    });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Order placement failed' });
  }
});

module.exports = router;
