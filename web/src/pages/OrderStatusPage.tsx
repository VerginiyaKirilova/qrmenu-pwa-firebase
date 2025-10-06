import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../utils/firebase';
import { Order } from '../types';
import StatusBadge from '../components/StatusBadge';
import useCart from '../hooks/useCart';

const OrderStatusPage = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  // Get session ID from cart store
  const { sessionId, restaurantId } = useCart();

  useEffect(() => {
    if (!sessionId || !restaurantId) {
      setLoading(false);
      return;
    }

    // Set up Firestore listener for orders with this sessionId
    const ordersQuery = query(
      collection(firestore, `restaurants/${restaurantId}/orders`),
      where('sessionId', '==', sessionId),
      where('status', 'in', ['received', 'in_progress', 'ready']), // Exclude served and canceled
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Order;
      });

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, restaurantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!sessionId || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
          <h1 className="text-2xl font-bold mb-4">No Active Orders</h1>
          <p className="text-gray-600 mb-6">You don't have any active orders at the moment.</p>
          <Link to="/menu" className="bg-indigo-600 text-white py-2 px-4 rounded-lg">
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        <Link to="/menu" className="text-indigo-600 hover:text-indigo-800">
          Back to Menu
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order #{order.orderNumber}</h2>
              <StatusBadge status={order.status} />
            </div>

            <div className="text-sm text-gray-500 mb-4">
              <p>Table: {order.tableId}</p>
              <p>Ordered: {order.createdAt.toLocaleTimeString()}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-2">Items:</h3>
              <ul className="space-y-2">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.qty}x {item.name}</span>
                      {item.note && (
                        <p className="text-xs text-gray-500 italic">Note: {item.note}</p>
                      )}
                    </div>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service:</span>
                <span>${order.totals.service.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${order.totals.grand.toFixed(2)}</span>
              </div>
            </div>

            {order.status === 'ready' && (
              <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md text-center">
                <p className="font-medium">Your order is ready!</p>
                <p className="text-sm">Please pick it up from the counter.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusPage;
