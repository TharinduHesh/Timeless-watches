import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { firestoreProductService } from '../services/firestore';
import ProductCard from '../components/product/ProductCard';

const Home = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: firestoreProductService.getAll,
  });
  
  // Get products with discounts for Special Offers section
  const specialOffers = products.filter(product => product.discount && product.discount > 0).slice(0, 8);

  return (
    <>
      <Helmet>
        <title>Timeless - Luxury Watches Collection</title>
        <meta
          name="description"
          content="Discover our exquisite collection of luxury timepieces. From classic elegance to modern sophistication."
        />
      </Helmet>

      <div className="home-page">
        {/* Hero Banner */}
        <section className="luxury-hero min-h-[70vh] flex items-center justify-center overflow-hidden border-b border-accent/10 relative">
          {/* Animated Luxury Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute top-0 left-0 w-full h-full" 
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(199,161,122,0.15) 0%, transparent 50%),
                                 radial-gradient(circle at 75% 75%, rgba(199,161,122,0.12) 0%, transparent 50%)`,
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 15s ease infinite'
              }}
            />
          </div>

          {/* Floating Luxury Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large rotating circle - slow elegant rotation */}
            <div 
              className="absolute top-10 left-10 w-80 h-80 border border-accent/10 rounded-full"
              style={{ animation: 'rotate 60s linear infinite' }}
            />
            
            {/* Medium rotating circle - opposite direction */}
            <div 
              className="absolute bottom-10 right-10 w-[500px] h-[500px] border-2 border-accent/10 rounded-full"
              style={{ animation: 'rotate 80s linear infinite reverse' }}
            />
            
            {/* Pulsing center circle */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-accent/5 rounded-full"
              style={{ animation: 'pulse-glow 8s ease-in-out infinite' }}
            />

            {/* Floating accent elements */}
            <div 
              className="absolute top-1/4 right-1/4 w-4 h-4 bg-accent/20 rounded-full blur-sm"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            />
            <div 
              className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-accent/15 rounded-full blur-sm"
              style={{ animation: 'float 8s ease-in-out infinite 2s' }}
            />
            <div 
              className="absolute top-1/3 left-1/4 w-3 h-3 bg-accent/25 rounded-full blur-sm"
              style={{ animation: 'float 7s ease-in-out infinite 1s' }}
            />
          </div>

          {/* Elegant Gradient Overlay with animated shimmer */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 20s ease infinite'
            }}
          />

          <div className="hero-content relative z-10 text-center px-4 py-16 max-w-5xl mx-auto">
            <div className="mb-6 animate-fade-in-up">
              <div className="inline-block px-6 py-2 border border-accent/30 rounded-full mb-8 backdrop-blur-md bg-white/5 shadow-lg"
                   style={{ animation: 'float 4s ease-in-out infinite' }}>
                <span className="text-accent text-sm font-semibold tracking-wider uppercase">Luxury Timepieces</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-white mb-6 animate-fade-in-up leading-tight"
                style={{ animationDelay: '0.2s' }}>
              <span 
                className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent"
                style={{ 
                  backgroundSize: '200% auto',
                  animation: 'gradient-shift 8s linear infinite'
                }}
              >
                Timeless Elegance
              </span>
            </h1>
            
            <p className="text-gray-300 text-xl md:text-2xl mb-10 animate-fade-in-up max-w-3xl mx-auto leading-relaxed" 
               style={{ animationDelay: '0.4s' }}>
              Discover the pinnacle of horological craftsmanship. Each timepiece tells a story of precision, luxury, and timeless beauty.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" 
                 style={{ animationDelay: '0.6s' }}>
              <Link
                to="/shop"
                className="btn-gold text-lg px-8 py-4 shadow-[0_10px_40px_rgba(199,161,122,0.3)] hover:shadow-[0_15px_50px_rgba(199,161,122,0.4)] transform hover:scale-105 transition-all duration-300"
              >
                Explore Collection
              </Link>
              <Link
                to="/about"
                className="btn-gold-outline text-lg px-8 py-4 backdrop-blur-sm bg-white/5 hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* Decorative Corner Elements with glow effect */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-accent/20"
               style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
          <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-accent/20"
               style={{ animation: 'pulse-glow 4s ease-in-out infinite 1s' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-accent/20"
               style={{ animation: 'pulse-glow 4s ease-in-out infinite 2s' }} />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-accent/20"
               style={{ animation: 'pulse-glow 4s ease-in-out infinite 3s' }} />
        </section>

        {/* Special Offers Section */}
        {specialOffers.length > 0 && (
          <section className="luxury-section section-container py-20">
            <div className="section-header text-center mb-16">
              <div className="inline-block mb-4">
                <span className="text-accent text-sm font-semibold tracking-[0.2em] uppercase">Limited Time</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                Special Offers
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Exclusive discounts on premium timepieces. Don't miss these exceptional deals
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : (
              <div className="products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {specialOffers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link to="/shop" className="btn-gold inline-block text-lg px-8 py-3">
                View All Offers
              </Link>
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="luxury-section section-container py-20 border-t border-white/5">
          <div className="section-header text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-accent text-sm font-semibold tracking-[0.2em] uppercase">Complete Collection</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              All Products
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Browse our entire collection of luxury timepieces
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/shop" className="btn-gold-outline inline-block text-lg px-8 py-3">
              Visit Shop
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="luxury-section section-container py-20 border-t border-white/5">
          <div className="text-center mb-16">
            <span className="text-accent text-sm font-semibold tracking-[0.2em] uppercase">Why Choose Timeless</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4 mb-4">
              The Timeless Promise
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-10 card-glass group hover:border-accent/30 transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">Authentic Timepieces</h3>
              <p className="text-gray-300 leading-relaxed">
                100% authentic watches from renowned brands with certificates of authenticity and complete documentation
              </p>
            </div>

            <div className="text-center p-10 card-glass group hover:border-accent/30 transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">Lifetime Warranty</h3>
              <p className="text-gray-300 leading-relaxed">
                Comprehensive warranty coverage and expert servicing for your absolute peace of mind
              </p>
            </div>

            <div className="text-center p-10 card-glass group hover:border-accent/30 transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-3">Secure Payment</h3>
              <p className="text-gray-300 leading-relaxed">
                Safe and secure payment processing with encryption and multiple trusted payment options
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
