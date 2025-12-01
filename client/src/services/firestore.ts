import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Product } from '../types';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const CONTACT_MESSAGES_COLLECTION = 'contactMessages';
const SETTINGS_COLLECTION = 'settings';
const REVIEWS_COLLECTION = 'reviews';

// ============= PRODUCTS =============

export const firestoreProductService = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(productsRef);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        // Ensure arrays exist
        images: doc.data().images || [doc.data().image],
        features: doc.data().features || [],
        specifications: doc.data().specifications || {},
      })) as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get single product by ID
  getById: async (id: string): Promise<Product | null> => {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      const snapshot = await getDoc(productRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data(),
        images: snapshot.data().images || [snapshot.data().image],
        features: snapshot.data().features || [],
        specifications: snapshot.data().specifications || {},
      } as Product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Get products by category
  getByCategory: async (category: string): Promise<Product[]> => {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const q = query(productsRef, where('category', '==', category));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        images: doc.data().images || [doc.data().image],
      })) as Product[];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Create new product
  create: async (productData: Omit<Product, 'id'>): Promise<Product> => {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const docRef = await addDoc(productsRef, {
        ...productData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...productData,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  update: async (id: string, productData: Partial<Product>): Promise<void> => {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  delete: async (id: string): Promise<void> => {
    try {
      // First, get the product to delete its images
      const product = await firestoreProductService.getById(id);
      
      if (product && product.images) {
        // Delete all images from storage
        await Promise.all(
          product.images.map(imageUrl => 
            firestoreStorageService.deleteImageByUrl(imageUrl)
          )
        );
      }
      
      // Then delete the product document
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};

// ============= STORAGE =============

export const firestoreStorageService = {
  // Upload multiple images (max 5)
  uploadImages: async (files: File[], productId: string): Promise<string[]> => {
    try {
      if (files.length > 5) {
        throw new Error('Maximum 5 images allowed per product');
      }

      const uploadPromises = files.map(async (file, index) => {
        // Create unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${index}_${file.name}`;
        const storageRef = ref(storage, `products/${productId}/${filename}`);
        
        // Upload file
        await uploadBytes(storageRef, file, {
          contentType: file.type,
        });
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  // Upload single image
  uploadImage: async (file: File, productId: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `products/${productId}/${filename}`);
      
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Delete image by URL
  deleteImageByUrl: async (imageUrl: string): Promise<void> => {
    try {
      // Extract path from URL
      const urlObj = new URL(imageUrl);
      const path = decodeURIComponent(
        urlObj.pathname.split('/o/')[1]?.split('?')[0] || ''
      );
      
      if (path) {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - image might already be deleted
    }
  },
};

// ============= ORDERS =============

export const firestoreOrderService = {
  // Get all orders
  getAll: async () => {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Create order
  create: async (orderData: any) => {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...orderData,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update order status
  updateStatus: async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
};

// ============= SETTINGS =============

export const firestoreSettingsService = {
  // Get settings
  get: async () => {
    try {
      const settingsRef = doc(db, SETTINGS_COLLECTION, 'general');
      const snapshot = await getDoc(settingsRef);
      
      if (!snapshot.exists()) {
        // Return default settings
        return { shippingFee: 0 };
      }
      
      return snapshot.data();
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Update settings
  update: async (settings: { shippingFee: number }) => {
    try {
      const settingsRef = doc(db, SETTINGS_COLLECTION, 'general');
      // Use setDoc with merge to create if doesn't exist
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },
};

// ============= CONTACT MESSAGES =============

export const firestoreContactService = {
  // Get all contact messages
  getAll: async () => {
    try {
      const messagesRef = collection(db, CONTACT_MESSAGES_COLLECTION);
      const q = query(messagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      throw error;
    }
  },

  // Create contact message
  create: async (messageData: { name: string; email: string; subject: string; message: string }) => {
    try {
      const messagesRef = collection(db, CONTACT_MESSAGES_COLLECTION);
      const docRef = await addDoc(messagesRef, {
        ...messageData,
        status: 'unread',
        createdAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...messageData,
      };
    } catch (error) {
      console.error('Error creating contact message:', error);
      throw error;
    }
  },

  // Update message status
  updateStatus: async (messageId: string, status: string) => {
    try {
      const messageRef = doc(db, CONTACT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  },

  // Delete message
  delete: async (messageId: string) => {
    try {
      const messageRef = doc(db, CONTACT_MESSAGES_COLLECTION, messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
};

// ============= REVIEWS =============

export const firestoreReviewService = {
  // Get all reviews for a product
  getByProduct: async (productId: string) => {
    try {
      const reviewsRef = collection(db, REVIEWS_COLLECTION);
      const q = query(reviewsRef, where('productId', '==', productId));
      const snapshot = await getDocs(q);
      
      const reviews = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      
      // Sort by date on client side
      return reviews.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return []; // Return empty array instead of throwing
    }
  },

  // Create review
  create: async (reviewData: { productId: string; userId: string; userName: string; userEmail: string; rating: number; comment: string }) => {
    try {
      const reviewsRef = collection(db, REVIEWS_COLLECTION);
      const docRef = await addDoc(reviewsRef, {
        ...reviewData,
        createdAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...reviewData,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Update review
  update: async (reviewId: string, data: { rating: number; comment: string }) => {
    try {
      const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
      await updateDoc(reviewRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete review
  delete: async (reviewId: string) => {
    try {
      const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
      await deleteDoc(reviewRef);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // Get average rating for a product
  getAverageRating: async (productId: string) => {
    try {
      const reviews = await firestoreReviewService.getByProduct(productId);
      if (reviews.length === 0) return { average: 0, count: 0 };
      
      const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      return {
        average: total / reviews.length,
        count: reviews.length,
      };
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return { average: 0, count: 0 };
    }
  },
};

export default {
  products: firestoreProductService,
  storage: firestoreStorageService,
  orders: firestoreOrderService,
  contactMessages: firestoreContactService,
  settings: firestoreSettingsService,
  reviews: firestoreReviewService,
};
