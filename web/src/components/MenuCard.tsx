import { useState } from 'react';
import { MenuItem } from '../types';
import useCart from '../hooks/useCart';

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      note: note.trim() || undefined
    });

    // Reset form
    setQuantity(1);
    setNote('');
    setShowAddForm(false);
  };

  if (!item.available) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm opacity-60 border border-gray-200">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium text-gray-700">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
            <p className="text-sm font-medium text-gray-900 mt-2">${item.price.toFixed(2)}</p>
          </div>
          {item.imagePath && (
            <div className="w-20 h-20 rounded-md overflow-hidden">
              <img
                src={item.imagePath}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="mt-3">
          <span className="inline-block px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded">
            Currently Unavailable
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium text-gray-800">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          )}
          <p className="text-sm font-medium text-gray-900 mt-2">${item.price.toFixed(2)}</p>
        </div>
        {item.imagePath && (
          <div className="w-20 h-20 rounded-md overflow-hidden">
            <img
              src={item.imagePath}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-3 w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add to Cart
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium text-gray-700">
              Quantity:
            </label>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 rounded-full bg-gray-200 text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="mx-2 w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 rounded-full bg-gray-200 text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`note-${item.id}`} className="block text-sm font-medium text-gray-700">
              Special Instructions:
            </label>
            <textarea
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
              placeholder="Any special requests?"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCard;
