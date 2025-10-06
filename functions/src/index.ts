import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import function modules
import { createOrder } from './createOrder';
import { updateOrderStatus } from './updateOrderStatus';
import { ordersOnCreate } from './ordersOnCreate';
import { paymentWebhook } from './paymentWebhook';

// Export functions
export {
  createOrder,
  updateOrderStatus,
  ordersOnCreate,
  paymentWebhook
};
