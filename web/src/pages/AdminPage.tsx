import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// This will be replaced with actual types from Firebase
type Order = {
  id: string;
  orderNumber: string;
  status: 'received' | 'in_progress' | 'ready' | 'served' | 'canceled';
  items: Array<{
    itemId: string;
    name: string;
    qty: number;
    price: number;
    note?: string;
  }>;
  totals: {
    subtotal: number;
    service: number;
    grand: number;
  };
  tableId: string;
  createdAt: Date;
  updatedAt: Date;
  paid: boolean;
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<Order['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Check if user is authenticated with Firebase Auth
    // For now, just simulate authentication
    const checkAuth = async () => {
      try {
        // Simulate auth check
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        setAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    // TODO: Set up Firestore listener for orders
    // This will be implemented when we set up Firebase

    // For now, just simulate loading
    const timer = setTimeout(() => {
      // Simulate some orders
      setOrders([]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [authenticated]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    // TODO: Call Firebase function to update order status
    console.log(`Updating order ${orderId} to status: ${newStatus}`);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'received': return 'in_progress';
      case 'in_progress': return 'ready';
      case 'ready': return 'served';
      default: return null;
    }
  };

  const getNextStatusText = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'received': return 'Start Preparing';
      case 'in_progress': return 'Mark as Ready';
      case 'ready': return 'Mark as Served';
      default: return '';
    }
  };

  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (activeFilter !== 'all' && order.status !== activeFilter) {
      return false;
    }

    // Filter by search term (order number)
    if (searchTerm && !order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Group orders by status for display
  const ordersByStatus = {
    received: filteredOrders.filter(o => o.status === 'received'),
    in_progress: filteredOrders.filter(o => o.status === 'in_progress'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
    served: filteredOrders.filter(o => o.status === 'served'),
    canceled: filteredOrders.filter(o => o.status === 'canceled'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setAuthenticated(true)}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => {
              // TODO: Sign out from Firebase Auth
              setAuthenticated(false);
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilter === 'received' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
              onClick={() => setActiveFilter('received')}
            >
              Received
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilter === 'in_progress' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}
              onClick={() => setActiveFilter('in_progress')}
            >
              In Progress
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilter === 'ready' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
              onClick={() => setActiveFilter('ready')}
            >
              Ready
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilter === 'served' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setActiveFilter('served')}
            >
              Served
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${activeFilter === 'canceled' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
              onClick={() => setActiveFilter('canceled')}
            >
              Canceled
            </button>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by order #"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No orders found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Received Orders */}
            {ordersByStatus.received.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-blue-800">Received</h2>
                <div className="space-y-4">
                  {ordersByStatus.received.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">#{order.orderNumber}</span>
                        <span className="text-sm text-gray-500">Table {order.tableId}</span>
                      </div>
                      <ul className="text-sm text-gray-600 mb-3">
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.qty}x {item.name}</li>
                        ))}
                      </ul>
                      <div className="flex justify-between">
                        <button
                          className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm"
                          onClick={() => handleStatusChange(order.id, 'canceled')}
                        >
                          Cancel
                        </button>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          onClick={() => handleStatusChange(order.id, getNextStatus(order.status) || order.status)}
                        >
                          {getNextStatusText(order.status)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Orders */}
            {ordersByStatus.in_progress.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-yellow-800">In Progress</h2>
                <div className="space-y-4">
                  {ordersByStatus.in_progress.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">#{order.orderNumber}</span>
                        <span className="text-sm text-gray-500">Table {order.tableId}</span>
                      </div>
                      <ul className="text-sm text-gray-600 mb-3">
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.qty}x {item.name}</li>
                        ))}
                      </ul>
                      <div className="flex justify-end">
                        <button
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                          onClick={() => handleStatusChange(order.id, getNextStatus(order.status) || order.status)}
                        >
                          {getNextStatusText(order.status)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready Orders */}
            {ordersByStatus.ready.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-green-800">Ready</h2>
                <div className="space-y-4">
                  {ordersByStatus.ready.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">#{order.orderNumber}</span>
                        <span className="text-sm text-gray-500">Table {order.tableId}</span>
                      </div>
                      <ul className="text-sm text-gray-600 mb-3">
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.qty}x {item.name}</li>
                        ))}
                      </ul>
                      <div className="flex justify-end">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                          onClick={() => handleStatusChange(order.id, getNextStatus(order.status) || order.status)}
                        >
                          {getNextStatusText(order.status)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
