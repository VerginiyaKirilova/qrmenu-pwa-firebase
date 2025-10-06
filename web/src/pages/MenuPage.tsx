import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../utils/firebase';
import { Restaurant, Table, MenuCategory, MenuItem } from '../types';
import MenuCard from '../components/MenuCard';
import CartDrawer from '../components/CartDrawer';
import useCart from '../hooks/useCart';

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get restaurant ID and table from URL params
  const rid = searchParams.get('rid');
  const tableId = searchParams.get('table');

  // Get cart state
  const { getTotalItems, setRestaurantAndTable } = useCart();
  const totalItems = getTotalItems();

  useEffect(() => {
    // Validate restaurant ID and table
    if (!rid) {
      setError('Restaurant ID is missing. Please scan a valid QR code.');
      setLoading(false);
      return;
    }

    if (!tableId) {
      setError('Table ID is missing. Please scan a valid QR code.');
      setLoading(false);
      return;
    }

    // Set restaurant and table in cart
    setRestaurantAndTable(rid, tableId);

    const fetchData = async () => {
      try {
        // Fetch restaurant data
        const restaurantDoc = await getDoc(doc(firestore, `restaurants/${rid}`));
        if (!restaurantDoc.exists()) {
          setError('Restaurant not found.');
          setLoading(false);
          return;
        }

        const restaurantData = { id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant;
        setRestaurant(restaurantData);

        // Fetch table data
        const tableDoc = await getDoc(doc(firestore, `restaurants/${rid}/tables/${tableId}`));
        if (!tableDoc.exists()) {
          setError('Table not found.');
          setLoading(false);
          return;
        }

        const tableData = { id: tableDoc.id, ...tableDoc.data() } as Table;
        if (!tableData.active) {
          setError('This table is currently inactive.');
          setLoading(false);
          return;
        }

        setTable(tableData);

        // Fetch menu categories
        const categoriesQuery = query(
          collection(firestore, `restaurants/${rid}/menuCategories`),
          // Add where clause if needed, e.g., where('active', '==', true)
        );

        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuCategory[];

        // Sort categories by order
        categoriesData.sort((a, b) => a.order - b.order);
        setCategories(categoriesData);

        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }

        // Fetch menu items
        const itemsQuery = query(
          collection(firestore, `restaurants/${rid}/menuItems`),
          // Add where clause if needed, e.g., where('available', '==', true)
        );

        const itemsSnapshot = await getDocs(itemsQuery);
        const itemsData = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];

        setMenuItems(itemsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load menu. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [rid, tableId, setRestaurantAndTable]);

  // Filter menu items by category and search term
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !activeCategory || item.categoryId === activeCategory;
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{restaurant?.name || 'Restaurant Menu'}</h1>
              <p className="text-sm text-gray-500">Table: {table?.label || tableId}</p>
            </div>
            <Link to="/order-status" className="text-indigo-600 hover:text-indigo-800">
              View Orders
            </Link>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          {!searchTerm && categories.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Menu Items */}
      <div className="container mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-gray-500">No menu items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md">
        <button
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg flex items-center justify-center"
          onClick={() => setIsCartOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          View Cart {totalItems > 0 && `(${totalItems})`}
        </button>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default MenuPage;
