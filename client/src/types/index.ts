export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  category: string;
  description?: string;
  stock: number;
  features?: string[];
  specifications?: Record<string, string>;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Filter {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest';
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  approved?: boolean;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}
