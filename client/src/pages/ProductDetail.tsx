import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { FiShoppingCart, FiHeart, FiArrowLeft } from 'react-icons/fi';
import { firestoreProductService as productService } from '../services/firestore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { ReviewSection } from '../components/ReviewSection';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem, openCart } = useCartStore();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Product - Timeless</title>
        </Helmet>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Helmet>
          <title>Product Not Found - Timeless</title>
        </Helmet>
        <div className="section-container text-center">
          <p className="text-muted text-xl mb-4">Product not found</p>
          <Link to="/shop" className="btn-gold inline-block">
            Back to Shop
          </Link>
        </div>
      </>
    );
  }

  const images = product.images || [product.image];
  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.discount && product.discount > 0;
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
  };

  return (
    <>
      <Helmet>
        <title>{product.name} - Timeless</title>
        <meta name="description" content={product.description || `${product.name} by ${product.brand}`} />
      </Helmet>

      <div className="product-detail-page section-container">
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-accent hover:text-accent-strong mb-8 transition-colors"
        >
          <FiArrowLeft /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="card-glass p-4 mb-4">
              {hasDiscount && (
                <div className="product-discount absolute top-6 right-6 z-10">
                  -{product.discount}%
                </div>
              )}
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`card-glass p-2 ${
                      selectedImage === idx ? 'border-2 border-accent' : ''
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-accent text-sm font-semibold mb-2">{product.brand}</p>
            <h1 className="text-4xl font-display font-bold text-white mb-4">{product.name}</h1>
            
            {/* Price */}
            <div className="mb-6">
              {hasDiscount && product.originalPrice ? (
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-extrabold text-accent">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-2xl text-muted line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-5xl font-extrabold text-accent">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {isOutOfStock ? (
                <div className="out-of-stock-badge inline-block">
                  OUT OF STOCK
                </div>
              ) : (
                <p className="text-muted">
                  <span className="text-white font-semibold">{product.stock}</span> in stock
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                <p className="text-muted leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">Features</h2>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted">
                      <span className="text-accent mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-3">Specifications</h2>
                <div className="card-glass p-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-white/[0.03] last:border-0">
                      <span className="text-muted">{key}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.05] text-white hover:bg-white/[0.05] transition-colors"
                  >
                    -
                  </button>
                  <span className="text-white text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.05] text-white hover:bg-white/[0.05] transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="btn-gold flex-grow flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={20} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button 
                onClick={handleWishlistToggle}
                className={`p-4 border-2 transition-all rounded-full ${
                  inWishlist
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-accent text-accent hover:bg-accent hover:text-black'
                }`}
              >
                <FiHeart size={24} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ReviewSection productId={product.id} />
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
