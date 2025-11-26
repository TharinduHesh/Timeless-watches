import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { firestoreProductService as productService } from '../services/firestore';
import ProductCard from '../components/product/ProductCard';
import type { Filter } from '../types';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filter>({
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    sort: (searchParams.get('sort') as Filter['sort']) || 'name-asc',
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  // Apply filters
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.brand?.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter((p) => p.category?.toLowerCase() === filters.category?.toLowerCase());
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    // Brand filter
    if (filters.brand) {
      result = result.filter((p) => p.brand?.toLowerCase() === filters.brand?.toLowerCase());
    }

    // Sorting
    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
    }

    return result;
  }, [products, filters]);

  // Extract unique categories and brands
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const brands = useMemo(() => {
    const brds = new Set(products.map((p) => p.brand).filter(Boolean));
    return Array.from(brds).sort();
  }, [products]);

  const updateFilter = (key: keyof Filter, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v.toString());
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ sort: 'name-asc' });
    setSearchParams({});
  };

  return (
    <>
      <Helmet>
        <title>Shop Luxury Watches - Timeless</title>
        <meta name="description" content="Browse our complete collection of luxury watches." />
      </Helmet>

      <div className="shop-page section-container">
        <div className="luxury-section text-center mb-12 py-12 rounded-2xl">
          <div className="inline-block mb-4">
            <span className="text-accent text-sm font-semibold tracking-[0.2em] uppercase">Premium Collection</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
            Our Collection
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mb-6"></div>
          <p className="text-gray-300 text-lg">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'exquisite timepiece' : 'exquisite timepieces'} available
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="filters-sidebar sticky top-24 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <h2 className="text-2xl font-display font-bold text-accent">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent hover:text-accent-strong transition-colors font-semibold"
                >
                  Clear All
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Search watches..."
                  className="input-dark w-full"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="input-dark w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Brand
                </label>
                <select
                  value={filters.brand || ''}
                  onChange={(e) => updateFilter('brand', e.target.value)}
                  className="input-dark w-full"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min"
                    className="input-dark w-full"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max"
                    className="input-dark w-full"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort || 'name-asc'}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="input-dark w-full"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted text-xl mb-4">No products found</p>
                <button onClick={clearFilters} className="btn-gold">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Shop;
