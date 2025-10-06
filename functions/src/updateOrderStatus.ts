import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Define types
interface UpdateOrderStatusData {
  rid: string;
  orderId: string;
  nextStatus: 'received' | 'in_progress' | 'ready' | 'served' | 'canceled';
}

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  'received': ['in_progress', 'canceled'],
  'in_progress': ['ready', 'canceled'],
  'ready': ['served', 'canceled'],
  'served': [],
  'canceled': []
};

export const updateOrderStatus = functions.https.onCall(async (data: UpdateOrderStatusData, context) => {
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
    const currentStatus = orderData?.status;

    // Validate status transition
    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Invalid status transition from ${currentStatus} to ${nextStatus}`
      );
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
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update order status', error);
  }
});

// Helper function to send FCM notification
async function sendNotification(rid: string, orderData: any) {
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
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw here, just log the error
    // We don't want to fail the status update if notification fails
  }
}
