import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiHeart } from 'react-icons/fi';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Cart from '../../components/Cart';
import logo from '../../assets/logo.jpg';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getTotalItems, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const totalItems = getTotalItems();
  const wishlistCount = wishlistItems.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <header className="main-nav fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/[0.03]">
        <nav className="nav-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src={logo} 
                alt="Timeless Logo" 
                className="h-12 md:h-14 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link to="/" className="text-white/85 hover:text-accent transition-colors">
                Home
              </Link>
              <Link to="/shop" className="text-white/85 hover:text-accent transition-colors">
                Shop
              </Link>
              <Link to="/about" className="text-white/85 hover:text-accent transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-white/85 hover:text-accent transition-colors">
                Contact
              </Link>
            </div>

            {/* Search Bar */}
            <form 
              onSubmit={handleSearch} 
              className="hidden md:flex items-center bg-white/[0.03] rounded-none px-4 py-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watches..."
                className="bg-transparent border-none outline-none text-white placeholder-muted w-32 lg:w-48"
              />
              <button type="submit" className="ml-2 text-muted hover:text-accent">
                <FiSearch size={18} />
              </button>
            </form>

            {/* Cart & Menu Icons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/wishlist"
                className="icon-btn relative p-2 text-white hover:text-accent transition-colors"
                aria-label="Wishlist"
              >
                <FiHeart size={24} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={openCart}
                className="icon-btn relative p-2 text-white hover:text-accent transition-colors"
                aria-label="Shopping cart"
              >
                <FiShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-white hover:text-accent transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden pb-4">
              <div className="flex flex-col space-y-3">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="flex md:hidden items-center bg-white/[0.03] rounded-none px-4 py-2 mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search watches..."
                    className="bg-transparent border-none outline-none text-white placeholder-muted w-full"
                  />
                  <button type="submit" className="ml-2 text-muted hover:text-accent">
                    <FiSearch size={18} />
                  </button>
                </form>

                <Link 
                  to="/" 
                  className="text-white/85 hover:text-accent transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/shop" 
                  className="text-white/85 hover:text-accent transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link 
                  to="/wishlist" 
                  className="text-white/85 hover:text-accent transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
                <Link 
                  to="/about" 
                  className="text-white/85 hover:text-accent transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className="text-white/85 hover:text-accent transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      <Cart />
    </>
  );
};

export default Header;
