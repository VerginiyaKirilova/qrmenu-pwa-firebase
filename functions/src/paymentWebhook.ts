import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const paymentWebhook = functions.https.onRequest(async (req, res) => {
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
    const paymentIntent = payload.data?.object;

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
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper function to mark an order as paid
async function markOrderAsPaid(rid: string, orderId: string) {
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
  } catch (error) {
    console.error(`Error marking order ${orderId} as paid:`, error);
    return false;
  }
}
