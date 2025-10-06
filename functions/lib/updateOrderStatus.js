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
exports.updateOrderStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Valid status transitions
const validTransitions = {
    'received': ['in_progress', 'canceled'],
    'in_progress': ['ready', 'canceled'],
    'ready': ['served', 'canceled'],
    'served': [],
    'canceled': []
};
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
    var _a;
    const { rid, orderId, nextStatus } = data;
    // Validate input
    if (!rid) {
        throw new functions.https.HttpsError('invalid-argument', 'Restaurant ID is required');
    }
    if (!orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
    }
    if (!nextStatus) {
        throw new functions.https.HttpsError('invalid-argument', 'Next status is required');
    }
    // Check if user is authenticated (for admin/KDS)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to update order status');
    }
    try {
        const db = admin.firestore();
        // Get the order document
        const orderRef = db.doc(`restaurants/${rid}/orders/${orderId}`);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Order not found');
        }
        const orderData = orderDoc.data();
        const currentStatus = orderData === null || orderData === void 0 ? void 0 : orderData.status;
        // Validate status transition
        if (!((_a = validTransitions[currentStatus]) === null || _a === void 0 ? void 0 : _a.includes(nextStatus))) {
            throw new functions.https.HttpsError('failed-precondition', `Invalid status transition from ${currentStatus} to ${nextStatus}`);
        }
        // Update the order status
        await orderRef.update({
            status: nextStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // If transitioning to 'received' or 'in_progress', send FCM notification
        if (nextStatus === 'received' || nextStatus === 'in_progress') {
            await sendNotification(rid, orderData);
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error updating order status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update order status', error);
    }
});
// Helper function to send FCM notification
async function sendNotification(rid, orderData) {
    try {
        // Get the FCM topic for this restaurant
        const topic = `admin_${rid}`;
        // Create notification message
        const message = {
            notification: {
                title: 'New Order',
                body: `Order #${orderData.orderNumber} from Table ${orderData.tableId}`
            },
            data: {
                orderId: orderData.id,
                orderNumber: orderData.orderNumber,
                tableId: orderData.tableId,
                status: orderData.status
            },
            topic
        };
        // Send the message
        await admin.messaging().send(message);
        console.log(`Notification sent to topic: ${topic}`);
    }
    catch (error) {
        console.error('Error sending notification:', error);
        // Don't throw here, just log the error
        // We don't want to fail the status update if notification fails
    }
}
//# sourceMappingURL=updateOrderStatus.js.map