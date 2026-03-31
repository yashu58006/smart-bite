const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// GET /api/admin/stats - Fetch dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = admin.firestore();
    
    // Get total counts
    const usersSnap = await db.collection('users').get();
    const ordersSnap = await db.collection('orders').get();
    const foodsSnap = await db.collection('foods').get();
    
    let totalRevenue = 0;
    const recentOrders = [];
    
    ordersSnap.forEach(doc => {
      const data = doc.data();
      totalRevenue += data.totalAmount || 0;
      if (recentOrders.length < 5) {
        recentOrders.push({ _id: doc.id, ...data });
      }
    });

    res.json({
      totalUsers: usersSnap.size,
      totalOrders: ordersSnap.size,
      totalFoods: foodsSnap.size,
      totalRevenue,
      recentOrders
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// GET /api/admin/orders - Get all orders
router.get('/orders', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ _id: doc.id, ...doc.data() });
    });
    
    res.json(orders);
  } catch (err) {
    console.error('Error loading admin orders:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    const db = admin.firestore();
    await db.collection('orders').doc(req.params.id).update({ status });
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(users);
  } catch (err) {
    console.error('Error loading users:', err);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

module.exports = router;
