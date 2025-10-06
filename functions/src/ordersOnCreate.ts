import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const ordersOnCreate = functions.firestore
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
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
  });
