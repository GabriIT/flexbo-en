
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-semibold tracking-tight">Flexbo Packaging</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink to="/" label="Home" active={location.pathname === '/'} />
            <NavLink to="/products" label="Products" active={location.pathname.includes('/products')} />
            <NavLink to="/about" label="About" active={location.pathname === '/about'} />
            <NavLink to="/contact" label="Contact" active={location.pathname === '/contact'} />
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 md:hidden"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <MobileNavLink to="/" label="Home" active={location.pathname === '/'} />
            <MobileNavLink to="/products" label="Products" active={location.pathname.includes('/products')} />
            <MobileNavLink to="/about" label="About" active={location.pathname === '/about'} />
            <MobileNavLink to="/contact" label="Contact" active={location.pathname === '/contact'} />
          </div>
        </div>
      )}
    </header>
  );
};

const NavLink = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link to={to} className={`nav-link ${active ? 'active' : ''}`}>
    {label}
  </Link>
);

const MobileNavLink = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
      active ? 'bg-secondary text-primary' : 'text-gray-600 hover:bg-secondary hover:text-primary'
    }`}
  >
    {label}
  </Link>
);

export default Header;
