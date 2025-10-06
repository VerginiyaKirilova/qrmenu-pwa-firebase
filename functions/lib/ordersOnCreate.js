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
exports.ordersOnCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.ordersOnCreate = functions.firestore
    .document('restaurants/{rid}/orders/{orderId}')
    .onCreate(async (snapshot, context) => {
    const { rid, orderId } = context.params;
    const orderData = snapshot.data();
    // Only send notification if status is 'received'
    if (orderData.status !== 'received') {
        return null;
    }
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
                orderId,
                orderNumber: orderData.orderNumber,
                tableId: orderData.tableId,
                status: orderData.status
            },
            topic
        };
        // Send the message
        await admin.messaging().send(message);
        console.log(`Notification sent to topic: ${topic} for order: ${orderId}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error };
    }
});
//# sourceMappingURL=ordersOnCreate.js.map