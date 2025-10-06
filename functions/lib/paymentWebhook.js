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
exports.paymentWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    // Get the request body
    const payload = req.body;
    // This is a stub function for payment webhook integration
    // In a real implementation, you would:
    // 1. Verify the webhook signature using the provider's SDK
    // 2. Parse the event type and data
    // 3. Handle different event types (payment.succeeded, payment.failed, etc.)
    try {
        // Log the webhook payload for debugging
        console.log('Payment webhook received:', payload);
        // Example implementation for Stripe webhook
        // This is just a placeholder and would need to be replaced with actual Stripe SDK code
        // Mock validation of signature
        const isValid = true; // In a real implementation, validate the signature
        if (!isValid) {
            console.error('Invalid webhook signature');
            res.status(400).send('Invalid signature');
            return;
        }
        // Mock event type and data extraction
        const eventType = payload.type || 'unknown';
        const paymentIntent = (_a = payload.data) === null || _a === void 0 ? void 0 : _a.object;
        if (!paymentIntent) {
            console.error('No payment intent in webhook payload');
            res.status(400).send('Invalid payload');
            return;
        }
        // Extract order information from metadata
        const { rid, orderId } = paymentIntent.metadata || {};
        if (!rid || !orderId) {
            console.error('Missing restaurant ID or order ID in payment metadata');
            res.status(400).send('Missing metadata');
            return;
        }
        // Handle different event types
        switch (eventType) {
            case 'payment_intent.succeeded':
                // Update the order as paid
                await markOrderAsPaid(rid, orderId);
                break;
            case 'payment_intent.payment_failed':
                // Handle failed payment
                console.log(`Payment failed for order ${orderId}`);
                break;
            default:
                // Ignore other event types
                console.log(`Ignoring event type: ${eventType}`);
        }
        // Return a success response
        res.status(200).send({ received: true });
    }
    catch (error) {
        console.error('Error processing payment webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Helper function to mark an order as paid
async function markOrderAsPaid(rid, orderId) {
    try {
        const db = admin.firestore();
        const orderRef = db.doc(`restaurants/${rid}/orders/${orderId}`);
        // Update the order
        await orderRef.update({
            paid: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Order ${orderId} marked as paid`);
        return true;
    }
    catch (error) {
        console.error(`Error marking order ${orderId} as paid:`, error);
        return false;
    }
}
//# sourceMappingURL=paymentWebhook.js.map