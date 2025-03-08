
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-primary mb-2">
          <AlertTriangle size={32} />
        </div>
        
        <h1 className="text-5xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-2 mb-6">
          Oops! The page you're looking for doesn't exist.
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Return to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
