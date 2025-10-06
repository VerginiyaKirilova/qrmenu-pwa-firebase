"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.createOrder = functions.https.onCall(async (data, context) => {
    const { rid, tableId, items, sessionId } = data;
    // Validate input
    if (!rid) {
        throw new functions.https.HttpsError('invalid-argument', 'Restaurant ID is required');
    }
    if (!tableId) {
        throw new functions.https.HttpsError('invalid-argument', 'Table ID is required');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Order must contain at least one item');
    }
    if (!sessionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Session ID is required');
    }
    try {
        const db = admin.firestore();
        // Verify restaurant exists
        const restaurantDoc = await db.doc(`restaurants/${rid}`).get();
        if (!restaurantDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Restaurant not found');
        }
        // Verify table exists and is active
        const tableDoc = await db.doc(`restaurants/${rid}/tables/${tableId}`).get();
        if (!tableDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Table not found');
        }
        const tableData = tableDoc.data();
        if (!(tableData === null || tableData === void 0 ? void 0 : tableData.active)) {
            throw new functions.https.HttpsError('failed-precondition', 'Table is not active');
        }
        // Verify all items exist and are available
        const itemIds = items.map(item => item.itemId);
        const menuItemsSnapshot = await db.collection(`restaurants/${rid}/menuItems`)
            .where(admin.firestore.FieldPath.documentId(), 'in', itemIds)
            .get();
        if (menuItemsSnapshot.size !== itemIds.length) {
            throw new functions.https.HttpsError('not-found', 'One or more menu items not found');
        }
        // Create a map of menu items for price validation
        const menuItemsMap = new Map();
        menuItemsSnapshot.forEach(doc => {
            const item = doc.data();
            if (!item.available) {
                throw new functions.https.HttpsError('failed-precondition', `Item ${doc.id} is not available`);
            }
            menuItemsMap.set(doc.id, item);
        });
        // Validate prices and calculate totals
        let subtotal = 0;
        const validatedItems = items.map(item => {
            const menuItem = menuItemsMap.get(item.itemId);
            if (menuItem.price !== item.price) {
                throw new functions.https.HttpsError('invalid-argument', `Price mismatch for item ${item.itemId}`);
            }
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            return {
                itemId: item.itemId,
                name: item.name,
                qty: item.qty,
                price: item.price,
                note: item.note || null
            };
        });
        // Calculate service charge and grand total
        const serviceCharge = subtotal * 0.1; // 10% service charge
        const grandTotal = subtotal + serviceCharge;
        // Get today's date in YYYY-MM-DD format for the counter document
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        // Use a transaction to increment the counter and create the order
        return db.runTransaction(async (transaction) => {
            var _a;
            // Get or create the counter document for today
            const counterRef = db.doc(`restaurants/${rid}/counters/${dateString}`);
            const counterDoc = await transaction.get(counterRef);
            let tableCounters = {};
            if (counterDoc.exists) {
                tableCounters = ((_a = counterDoc.data()) === null || _a === void 0 ? void 0 : _a.tableCounters) || {};
            }
            // Initialize counter for this table if it doesn't exist
            if (!tableCounters[tableId]) {
                tableCounters[tableId] = 0;
            }
            // Increment the counter
            tableCounters[tableId]++;
            // Update the counter document
            transaction.set(counterRef, { tableCounters }, { merge: true });
            // Format order number: T7-012 (table-counter with leading zeros)
            const orderNumber = `${tableId}-${tableCounters[tableId].toString().padStart(3, '0')}`;
            // Create the order document
            const orderRef = db.collection(`restaurants/${rid}/orders`).doc();
            const orderData = {
                orderNumber,
                tableId,
                status: 'received',
                items: validatedItems,
                totals: {
                    subtotal,
                    service: serviceCharge,
                    grand: grandTotal
                },
                sessionId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                paid: false
            };
            transaction.set(orderRef, orderData);
            return {
                orderId: orderRef.id,
                orderNumber
            };
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create order', error);
    }
});
//# sourceMappingURL=createOrder.js.map