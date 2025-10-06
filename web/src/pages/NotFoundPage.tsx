import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <Link
            to="/menu"
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Menu
          </Link>
          <Link
            to="/admin"
            className="text-indigo-600 py-2 px-4 rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
