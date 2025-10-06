import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import { functions } from '../utils/firebase';
import { httpsCallable } from 'firebase/functions';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    items,
    restaurantId,
    tableId,
    sessionId,
    removeItem,
    updateItemQuantity,
    updateItemNote,
    clearCart,
    getTotalItems,
    getTotalPrice
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const serviceCharge = subtotal * 0.1; // 10% service charge
  const total = subtotal + serviceCharge;

  const handlePlaceOrder = async () => {
    if (!restaurantId || !tableId) {
      setError('Restaurant or table information is missing.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert cart items to order items format
      const orderItems = items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        note: item.note
      }));

      // Call Firebase function to create order
      const createOrder = httpsCallable(functions, 'createOrder');
      const result = await createOrder({
        rid: restaurantId,
        tableId,
        items: orderItems,
        sessionId
      });

      // Handle response
      const { orderId, orderNumber } = (result.data as any);

      // Clear cart and close drawer
      clearCart();
      onClose();

      // Navigate to order status page
      navigate('/order-status');
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="px-4 py-6 bg-indigo-700 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Your Cart</h2>
                <button
                  type="button"
                  className="text-indigo-200 hover:text-white focus:outline-none"
                  onClick={onClose}
                >
                  <span className="sr-only">Close panel</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-1">
                <p className="text-sm text-indigo-300">
                  {totalItems === 0
                    ? 'Your cart is empty'
                    : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`
                  }
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                  <p className="mt-4 text-gray-500">Your cart is empty</p>
                  <button
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={onClose}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.itemId} className="px-4 py-4 sm:px-6">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                          {item.note && (
                            <p className="mt-1 text-xs text-gray-500 italic">Note: {item.note}</p>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                              className="p-1 rounded-full bg-gray-200 text-gray-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <span className="mx-2 w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                              className="p-1 rounded-full bg-gray-200 text-gray-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.itemId)}
                            className="mt-2 text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 sm:p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Subtotal</p>
                    <p className="text-gray-900">${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Service Charge (10%)</p>
                    <p className="text-gray-900">${serviceCharge.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-base font-medium">
                    <p className="text-gray-900">Total</p>
                    <p className="text-gray-900">${total.toFixed(2)}</p>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">
                    {error}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || items.length === 0}
                  >
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={onClose}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
