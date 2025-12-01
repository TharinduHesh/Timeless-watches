import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { firestoreProductService } from '../services/firestore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { FiX, FiShoppingCart, FiHeart } from 'react-icons/fi';

const Wishlist = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  // Fetch all products
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: firestoreProductService.getAll,
  });

  // Filter wishlist products
  const wishlistProducts = allProducts.filter(product =>
    items.some(item => item.productId === product.id)
  );

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    openCart();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="h-64 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist - Timeless</title>
        <meta name="description" content="Your saved favorite watches and jewelry" />
      </Helmet>

      <div className="min-h-screen py-20 px-4">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-accent mb-2">
                My Wishlist
              </h1>
              <p className="text-white/60">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>

            {wishlistProducts.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all items from wishlist?')) {
                    clearWishlist();
                  }
                }}
                className="btn-secondary"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Empty State */}
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-16">
              <FiHeart className="w-24 h-24 text-white/20 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
              <p className="text-white/60 mb-8">
                Start adding products you love to your wishlist
              </p>
              <Link to="/shop" className="btn-primary inline-block">
                Browse Products
              </Link>
            </div>
          ) : (
            /* Wishlist Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const hasDiscount = product.discount && product.discount > 0;
                const originalPrice = hasDiscount 
                  ? product.price / (1 - (product.discount ?? 0) / 100) 
                  : product.price;

                return (
                  <div key={product.id} className="card-glass p-4 relative group">
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-red-500/20 transition-all duration-300"
                      aria-label="Remove from wishlist"
                    >
                      <FiX className="w-5 h-5 text-white hover:text-red-500" />
                    </button>

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 z-10 bg-accent text-black px-2 py-1 rounded-md text-xs font-bold">
                        -{product.discount}%
                      </div>
                    )}

                    {/* Product Image */}
                    <Link to={`/product/${product.id}`}>
                      <div className="relative overflow-hidden rounded-lg bg-white/5 mb-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <Link to={`/product/${product.id}`}>
                      <p className="text-sm text-white/60 mb-1">{product.brand}</p>
                      <h3 className="font-semibold mb-2 line-clamp-2 hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="mb-3">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-accent font-bold text-lg">
                            LKR {product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-white/60 line-through">
                            LKR {originalPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-accent font-bold text-lg">
                          LKR {product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    {product.stock > 0 ? (
                      <p className="text-sm text-green-500 mb-3">
                        {product.stock} in stock
                      </p>
                    ) : (
                      <p className="text-sm text-red-500 mb-3">Out of stock</p>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <FiShoppingCart />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
