# Firebase Emulator Guide

This guide will help you understand how to work with Firebase Emulator and how to test your application locally.

## 1. Starting the Firebase Emulator

Firebase Emulator is a local version of Firebase services that allows you to test your application without using the real Firebase infrastructure.

To start the Firebase Emulator, run the following command in the project's root directory:

```bash
firebase emulators:start
```

This will start all emulators configured in your `firebase.json` file, including:
- Firestore emulator on port 8082
- Auth emulator on port 9099
- Functions emulator on port 5001
- Storage emulator on port 9199
- Hosting emulator on port 5000

## 2. Adding Test Data to Firestore

To test your application, you need to add test data to the Firestore emulator. There are two ways to do this:

### Using the Emulator UI

1. Open the emulator UI in your browser: http://localhost:4000
2. Click on "Firestore" in the navigation
3. Use the interface to create collections and documents

### Using the Seed Script

The project includes a script that automatically adds test data to the Firestore emulator. To use it:

1. Make sure the Firebase emulator is running
2. Make sure you're using Node.js version 10 or later (the script uses firebase-admin v9.12.0)
3. Open a new terminal
4. Navigate to the `tools` directory:
   ```bash
   cd tools
   ```
5. Run the data seeding script:
   ```bash
   npm run seed-data
   ```

This script will add the following data:
- A restaurant with ID "R123"
- A table with ID "T7" in the restaurant
- Menu categories (Appetizers, Main Courses, Desserts, Drinks)
- Several menu items in each category

## 3. Firestore Data Structure

The application expects the following data structure in Firestore:

```
restaurants/{rid}                      # Restaurant document
restaurants/{rid}/tables/{tableId}     # Table documents
restaurants/{rid}/menuCategories/{categoryId}  # Menu category documents
restaurants/{rid}/menuItems/{itemId}   # Menu item documents
```

Where:
- `{rid}` is the restaurant ID (e.g., "R123")
- `{tableId}` is the table ID (e.g., "T7")
- `{categoryId}` is the category ID (e.g., "appetizers")
- `{itemId}` is the menu item ID (e.g., "french-fries")

## 4. Testing the Application

After you've started the emulator and added test data, you can test the application:

1. Start the application in a separate terminal:
   ```bash
   cd web
   npm run dev
   ```

2. Open the application in your browser: http://localhost:5173/menu?rid=R123&table=T7

The application should load data from the Firestore emulator and display the restaurant's menu.

## 5. Troubleshooting

If the application cannot find data in the Firestore emulator, check the following:

1. Make sure the Firebase emulator is running
2. Make sure you've added test data with the correct structure
3. Check the browser console for errors
4. Ensure that the ports in `firebase.ts` match the ports in `firebase.json`

The most common error is a port mismatch. In `firebase.ts`, you should have:

```javascript
connectFirestoreEmulator(firestore, 'localhost', 8082);
```

And in `firebase.json`, you should have:

```json
{
  "firestore": {
    "port": 8082
  }
}
```

## 6. Important Files

- `web/src/utils/firebase.ts` - Firebase configuration and emulator connection
- `tools/seed-data.js` - Script for adding test data
- `firebase.json` - Firebase emulators configuration
- `web/src/pages/MenuPage.tsx` - The main page that loads data from Firestore

## 7. Conclusion

Working with Firebase Emulator allows you to test your application locally without using the real Firebase infrastructure. This is useful for development and testing as it doesn't consume real resources and doesn't require an internet connection.

Don't forget to add test data to the emulator before testing your application!
