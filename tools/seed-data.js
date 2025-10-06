const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with emulator
admin.initializeApp({
  projectId: 'qrmenu-pwa-firebase'
});

// Connect to Firestore emulator
const db = admin.firestore();
db.settings({
  host: 'localhost:8082',
  ssl: false
});

// Restaurant data
const restaurantData = {
  name: 'Demo Restaurant',
  enablePayments: false,
  description: 'A demo restaurant for testing',
  logoUrl: 'https://via.placeholder.com/150'
};

// Table data
const tableData = {
  label: 'Table 7',
  active: true
};

// Menu category data
const categoryData = [
  { name: 'Appetizers', order: 1 },
  { name: 'Main Courses', order: 2 },
  { name: 'Desserts', order: 3 },
  { name: 'Drinks', order: 4 }
];

// Menu item data
const menuItemsData = [
  {
    name: 'French Fries',
    description: 'Crispy golden fries served with ketchup',
    price: 4.99,
    categoryId: 'appetizers',
    available: true
  },
  {
    name: 'Chicken Wings',
    description: 'Spicy chicken wings with blue cheese dip',
    price: 8.99,
    categoryId: 'appetizers',
    available: true
  },
  {
    name: 'Burger',
    description: 'Juicy beef burger with cheese, lettuce, and tomato',
    price: 12.99,
    categoryId: 'main-courses',
    available: true
  },
  {
    name: 'Pizza',
    description: 'Margherita pizza with tomato sauce and mozzarella',
    price: 14.99,
    categoryId: 'main-courses',
    available: true
  },
  {
    name: 'Ice Cream',
    description: 'Vanilla ice cream with chocolate sauce',
    price: 5.99,
    categoryId: 'desserts',
    available: true
  },
  {
    name: 'Soda',
    description: 'Coca-Cola, Sprite, or Fanta',
    price: 2.99,
    categoryId: 'drinks',
    available: true
  }
];

// Add restaurant data
async function seedData() {
  try {
    // Add restaurant
    await db.collection('restaurants').doc('R123').set(restaurantData);
    console.log('Restaurant data added successfully');

    // Add table
    await db.collection('restaurants').doc('R123').collection('tables').doc('T7').set(tableData);
    console.log('Table data added successfully');

    // Add categories
    const categoriesRef = db.collection('restaurants').doc('R123').collection('menuCategories');
    for (const category of categoryData) {
      const docId = category.name.toLowerCase().replace(/\s+/g, '-');
      await categoriesRef.doc(docId).set(category);
    }
    console.log('Category data added successfully');

    // Add menu items
    const menuItemsRef = db.collection('restaurants').doc('R123').collection('menuItems');
    for (const item of menuItemsData) {
      const docId = item.name.toLowerCase().replace(/\s+/g, '-');
      await menuItemsRef.doc(docId).set(item);
    }
    console.log('Menu item data added successfully');

    console.log('All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

seedData();
