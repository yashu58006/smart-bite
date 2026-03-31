const admin = require('firebase-admin');
const crypto = require('crypto');
require('dotenv').config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set!');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
  process.exit(1);
}

const db = admin.firestore();

const sampleFoods = [
  // Main Course
  { name: 'Paneer Butter Masala', price: 280, category: 'Main Course', image: '🥘', description: 'Creamy paneer in tomato gravy', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400' },
  { name: 'Butter Chicken', price: 350, category: 'Main Course', image: '🍗', description: 'Tender chicken in rich makhani sauce', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400' },
  { name: 'Veg Biryani', price: 240, category: 'Main Course', image: '🍚', description: 'Aromatic basmati rice with veggies', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&q=80&w=400' },
  
  // Pizza
  { name: 'Margherita Pizza', price: 299, category: 'Pizza', image: '🍕', description: 'Classic cheese and tomato', imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?auto=format&fit=crop&q=80&w=400' },
  { name: 'Peppy Paneer', price: 449, category: 'Pizza', image: '🍕', description: 'Spiced paneer, capsicum & red paprika', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400' },
  
  // Burgers
  { name: 'Aloo Tikki Burger', price: 99, category: 'Burgers', image: '🍔', description: 'Crispy potato patty with mayo', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cheese Lava Burger', price: 189, category: 'Burgers', image: '🍔', description: 'Double patty with oozing cheese', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400' },
  
  // Pasta
  { name: 'White Sauce Pasta', price: 220, category: 'Pasta', image: '🍝', description: 'Creamy Alfredo penne with veggies', imageUrl: 'https://images.unsplash.com/photo-1645112481338-3560e99815fe?auto=format&fit=crop&q=80&w=400' },
  { name: 'Arrabbiata Pasta', price: 210, category: 'Pasta', image: '🍝', description: 'Spicy red sauce penne', imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400' },
  
  // Salads
  { name: 'Caesar Salad', price: 180, category: 'Salads', image: '🥗', description: 'Crispy lettuce, croutons & parmesan', imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=400' },
  
  // Starters
  { name: 'Crispy Corn', price: 160, category: 'Starters', image: '🌽', description: 'Spicy fried corn kernels', imageUrl: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Spring Rolls', price: 140, category: 'Starters', image: '🥙', description: 'Vegetable filled crispy rolls', imageUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&q=80&w=400' },
  
  // Desserts
  { name: 'Gulab Jamun', price: 80, category: 'Desserts', image: '🍮', description: 'Small milk-solid balls in syrup', imageUrl: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&q=80&w=400' },
  { name: 'Chocolate Brownie', price: 120, category: 'Desserts', image: '🍰', description: 'Fudgy brownie with walnuts', imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=400' },
  
  // Beverages
  { name: 'Cold Coffee', price: 110, category: 'Beverages', image: '🥤', description: 'Rich creamy blended coffee', imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400' },
  { name: 'Mango Lassi', price: 90, category: 'Beverages', image: '🥛', description: 'Yogurt based mango drink', imageUrl: 'https://images.unsplash.com/photo-1528664155601-526487e6576d?auto=format&fit=crop&q=80&w=400' }
];

async function seedDatabase() {
  console.log('🚀 Starting database seed...');
  const foodsRef = db.collection('foods');
  const usersRef = db.collection('users');
  
  try {
    // 1. Seed Foods
    const existingFoods = await foodsRef.get();
    if (existingFoods.empty) {
      for (const food of sampleFoods) {
        await foodsRef.add({
          ...food,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Added Food: ${food.name}`);
      }
    } else {
      console.log('ℹ️ Foods already exist, skipping food seed.');
    }

    // 2. Seed Admin User
    const adminEmail = 'admin@smartfood.com';
    const adminSnapshot = await usersRef.where('email', '==', adminEmail).get();
    
    if (adminSnapshot.empty) {
      const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
      await usersRef.add({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`👤 Created Admin: ${adminEmail} (password: admin123)`);
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    console.log('✨ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
