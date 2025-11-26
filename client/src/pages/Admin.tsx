import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { firestoreProductService, firestoreStorageService, firestoreContactService } from '../services/firestore';
import { firebaseAuthService } from '../services/firebaseAuth';
import { useAuthStore } from '../store/authStore';
import type { Product } from '../types';
import { 
  FiLogOut, FiPlus, FiEdit2, FiTrash2, FiImage, FiX, 
  FiPackage, FiSettings, FiUpload, FiMail 
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, logout, login } = useAuthStore();
  const sessionTimeoutRef = useRef<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'messages' | 'settings'>('dashboard');
  const [showLoginForm, setShowLoginForm] = useState(!isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Settings state
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Category management state
  const [categories, setCategories] = useState<string[]>([
    'watch', 'bracelet', 'necklace', 'ring', 'earring', 'anklet', 'chain', 'pendant'
  ]);
  const [newCategory, setNewCategory] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<Array<{email: string, uid: string}>>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Session timeout (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const resetSessionTimeout = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    sessionTimeoutRef.current = setTimeout(() => {
      alert('Session expired due to inactivity. Please login again.');
      handleLogout();
    }, SESSION_TIMEOUT);
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        login(token);
        setShowLoginForm(false);
        resetSessionTimeout();
      } else {
        logout();
        setShowLoginForm(true);
      }
    });

    return () => {
      unsubscribe();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [login, logout]);

  // Reset session timeout on user activity
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetSessionTimeout);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetSessionTimeout);
        });
      };
    }
  }, [isAuthenticated]);

  // Load categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('product-categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    }
  }, []);

  // Save categories to localStorage
  useEffect(() => {
    localStorage.setItem('product-categories', JSON.stringify(categories));
  }, [categories]);

  // Fetch settings and admin users
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      fetchAdminUsers();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) return;
      const token = await user.getIdToken(true); // Force refresh token
      
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setShippingFee(data.shippingFee || 0);
      } else {
        console.error('Failed to fetch settings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  // Product form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    stock: '',
    discount: '',
    description: '',
  });

  // Message modal state
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Multiple image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Handle Firebase login with enhanced security
  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const user = await firebaseAuthService.signIn(email, password);
      const token = await user.getIdToken();
      
      // Store token securely (httpOnly cookies would be better, but using localStorage with timeout)
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminLoginTime', Date.now().toString());
      
      login(token);
      setShowLoginForm(false);
      resetSessionTimeout();
      
      // Clear password field for security
      setPassword('');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setLoginError('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setLoginError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setLoginError('Invalid email address.');
      } else if (error.code === 'auth/user-disabled') {
        setLoginError('This account has been disabled.');
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-credential') {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.signOut();
      
      // Clear stored tokens and session data
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminLoginTime');
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      
      logout();
      setShowLoginForm(true);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: adminProductService.getAll,
    enabled: isAuthenticated,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: firestoreContactService.getAll,
    enabled: isAuthenticated,
  });

  const updateMessageStatusMutation = useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: 'read' | 'unread' }) =>
      firestoreContactService.updateStatus(messageId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    },
    onError: (error) => {
      console.error('Error updating message status:', error);
      alert('Failed to update message status');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => firestoreContactService.delete(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    },
  });

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + selectedImages.length + files.length;
    
    if (totalImages > 5) {
      alert('Maximum 5 images allowed per product');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      let imageUrls: string[] = [];
      
      // Upload images if selected
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        const productId = 'temp_' + Date.now();
        const files = Array.from(selectedImages);
        imageUrls = await firestoreStorageService.uploadImages(files, productId);
      }
      
      const productData = {
        ...data,
        image: imageUrls[0] || '',
        images: imageUrls,
      };
      
      return firestoreProductService.create(productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      resetProductForm();
      alert('Product created successfully');
    },
    onError: (error: any) => {
      alert('Failed to create product: ' + error.message);
    },
    onSettled: () => {
      setUploadingImages(false);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      let newImageUrls: string[] = [];
      
      // Upload new images if selected
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        selectedImages.forEach(file => {
          formData.append('images', file);
        });
        formData.append('productId', id);
        
        const files = Array.from(newImages);
        newImageUrls = await firestoreStorageService.uploadImages(files, id);
      }
      
      const allImages = [...existingImages, ...newImageUrls];
      const productData = {
        ...data,
        image: allImages[0] || '',
        images: allImages,
      };
      
      return firestoreProductService.update(id, productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      alert('Product updated successfully');
    },
    onError: (error: any) => {
      alert('Failed to update product: ' + error.message);
    },
    onSettled: () => {
      setUploadingImages(false);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: firestoreProductService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Product deleted successfully');
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: { shippingFee: number }) => {
      // Get fresh token from Firebase
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken(true); // Force refresh
      
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      alert('Settings saved successfully');
      fetchSettings(); // Refresh settings after save
    },
    onError: (error: any) => {
      console.error('Save settings error:', error);
      alert('Failed to save settings: ' + error.message);
    },
  });

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      brand: '',
      category: '',
      price: '',
      stock: '',
      discount: '',
      description: '',
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      discount: product.discount?.toString() || '',
      description: product.description || '',
    });
    setExistingImages(product.images || [product.image]);
    setSelectedImages([]);
    setImagePreviews([]);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: productFormData.name,
      brand: productFormData.brand,
      category: productFormData.category,
      price: parseFloat(productFormData.price),
      stock: parseInt(productFormData.stock),
      discount: productFormData.discount ? parseFloat(productFormData.discount) : 0,
      description: productFormData.description,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    saveSettingsMutation.mutate({ shippingFee }, {
      onSettled: () => setIsSavingSettings(false),
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) {
        setPasswordError('User not authenticated');
        return;
      }
      
      // Re-authenticate user first
      await firebaseAuthService.signIn(user.email!, currentPassword);
      
      // Update password
      const { auth: authInstance } = await import('../config/firebase');
      const { updatePassword } = await import('firebase/auth');
      await updatePassword(authInstance.currentUser!, newPassword);
      
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else {
        setPasswordError('Failed to change password: ' + error.message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) return;
      const token = await user.getIdToken(true);
      
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAdmin(true);
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken(true);
      
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add admin');
      }
      
      alert('Admin user added successfully!');
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Add admin error:', error);
      alert('Failed to add admin: ' + error.message);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (uid: string, email: string) => {
    if (!confirm(`Are you sure you want to remove admin user: ${email}?`)) return;
    
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken(true);
      
      const response = await fetch(`${API_BASE}/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove admin');
      }
      
      alert('Admin user removed successfully!');
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Remove admin error:', error);
      alert('Failed to remove admin: ' + error.message);
    }
  };

  // Calculate simplified dashboard statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  // Show login form if not authenticated
  if (showLoginForm || !isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Admin Login - Timeless</title>
        </Helmet>

        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="card-glass p-8 w-full max-w-md">
            <h1 className="text-3xl font-display font-bold text-accent text-center mb-8">
              Admin Login
            </h1>

            <form onSubmit={handleFirebaseLogin} className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark w-full"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-sm text-center">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="add-to-cart-btn w-full"
              >
                {isLoggingIn ? 'Logging in...' : 'Login with Firebase'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel - Timeless</title>
      </Helmet>

      <div className="admin-page section-container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white">
            Admin Panel
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white hover:text-accent transition-colors"
          >
            <FiLogOut size={20} />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-accent to-accent-strong text-black'
                : 'bg-white/[0.03] text-white hover:bg-white/[0.05]'
            }`}
          >
            <FiPackage className="inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-accent to-accent-strong text-black'
                : 'bg-white/[0.03] text-white hover:bg-white/[0.05]'
            }`}
          >
            <FiEdit2 className="inline mr-2" />
            Manage Products
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-accent to-accent-strong text-black'
                : 'bg-white/[0.03] text-white hover:bg-white/[0.05]'
            }`}
          >
            <FiMail className="inline mr-2" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-accent to-accent-strong text-black'
                : 'bg-white/[0.03] text-white hover:bg-white/[0.05]'
            }`}
          >
            <FiSettings className="inline mr-2" />
            Settings
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-glass p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Products</p>
                    <p className="text-3xl font-bold text-white">{totalProducts}</p>
                  </div>
                  <FiPackage size={40} className="text-accent" />
                </div>
              </div>

              <div className="card-glass p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Low Stock</p>
                    <p className="text-3xl font-bold text-yellow-500">{lowStockProducts}</p>
                  </div>
                  <FiPackage size={40} className="text-yellow-500" />
                </div>
              </div>

              <div className="card-glass p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-500">{outOfStockProducts}</p>
                  </div>
                  <FiPackage size={40} className="text-red-500" />
                </div>
              </div>
            </div>

            {/* Low Stock Products */}
            {lowStockProducts > 0 && (
              <div className="card-glass p-6">
                <h2 className="text-2xl font-bold text-accent mb-4">
                  Low Stock Alert
                </h2>
                <div className="space-y-2">
                  {products
                    .filter(p => p.stock < 10 && p.stock > 0)
                    .map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-white/[0.02] rounded">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-12 h-12 object-contain bg-white/5 rounded" />
                          <div>
                            <span className="text-white block">{product.name}</span>
                            <span className="text-gray-400 text-sm">{product.brand}</span>
                          </div>
                        </div>
                        <span className="text-yellow-500 font-bold">Stock: {product.stock}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Out of Stock Products */}
            {outOfStockProducts > 0 && (
              <div className="card-glass p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-4">
                  Out of Stock
                </h2>
                <div className="space-y-2">
                  {products
                    .filter(p => p.stock === 0)
                    .map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-white/[0.02] rounded">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-12 h-12 object-contain bg-white/5 rounded" />
                          <div>
                            <span className="text-white block">{product.name}</span>
                            <span className="text-gray-400 text-sm">{product.brand}</span>
                          </div>
                        </div>
                        <span className="text-red-500 font-bold">OUT OF STOCK</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('products')}
                  className="bg-white/[0.03] hover:bg-white/[0.06] text-white p-4 rounded-lg transition-all text-left"
                >
                  <FiPlus className="inline mr-2" size={20} />
                  <span className="font-semibold">Add New Product</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="bg-white/[0.03] hover:bg-white/[0.06] text-white p-4 rounded-lg transition-all text-left"
                >
                  <FiSettings className="inline mr-2" size={20} />
                  <span className="font-semibold">Update Shipping Fee</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetProductForm();
                  setShowProductForm(true);
                }}
                className="add-to-cart-btn flex items-center gap-2"
              >
                <FiPlus size={20} />
                Add New Product
              </button>
            </div>

            {showProductForm && (
              <div className="card-glass p-6 mb-6">
                <h2 className="text-2xl font-bold text-accent mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2">Name *</label>
                      <input
                        type="text"
                        value={productFormData.name}
                        onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                        className="input-dark w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">Brand</label>
                      <input
                        type="text"
                        value={productFormData.brand}
                        onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                        className="input-dark w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">Category</label>
                      <select
                        value={productFormData.category}
                        onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                        className="input-dark w-full"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat} className="capitalize">
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white mb-2">Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productFormData.price}
                        onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                        className="input-dark w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">Stock *</label>
                      <input
                        type="number"
                        value={productFormData.stock}
                        onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                        className="input-dark w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">Discount (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productFormData.discount}
                        onChange={(e) => setProductFormData({ ...productFormData, discount: e.target.value })}
                        className="input-dark w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-2">Description</label>
                    <textarea
                      value={productFormData.description}
                      onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                      className="input-dark w-full"
                      rows={3}
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-white mb-2">
                      Product Images (Max 5 images)
                    </label>
                    
                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Existing Images:</p>
                        <div className="flex flex-wrap gap-3">
                          {existingImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`Product ${index + 1}`}
                                className="w-24 h-24 object-contain bg-white/5 rounded border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">New Images:</p>
                        <div className="flex flex-wrap gap-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-24 h-24 object-contain bg-white/5 rounded border border-accent"
                              />
                              <button
                                type="button"
                                onClick={() => removeSelectedImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    {(existingImages.length + selectedImages.length) < 5 && (
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <FiUpload size={32} className="text-accent" />
                          <span className="text-white">Click to upload images</span>
                          <span className="text-gray-400 text-sm">
                            {5 - existingImages.length - selectedImages.length} images remaining
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      className="add-to-cart-btn flex-1"
                      disabled={uploadingImages || createProductMutation.isPending || updateProductMutation.isPending}
                    >
                      {uploadingImages ? 'Uploading Images...' : 
                       editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                        resetProductForm();
                      }}
                      className="btn-gold-outline flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card-glass p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-left text-accent font-semibold p-3">Image</th>
                      <th className="text-left text-accent font-semibold p-3">Name</th>
                      <th className="text-left text-accent font-semibold p-3">Brand</th>
                      <th className="text-left text-accent font-semibold p-3">Price</th>
                      <th className="text-left text-accent font-semibold p-3">Stock</th>
                      <th className="text-left text-accent font-semibold p-3">Images</th>
                      <th className="text-left text-accent font-semibold p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="p-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-contain bg-white/5 rounded"
                          />
                        </td>
                        <td className="text-white p-3">{product.name}</td>
                        <td className="text-gray-300 p-3">{product.brand}</td>
                        <td className="text-accent font-bold p-3">
                          LKR {product.price.toFixed(2)}
                        </td>
                        <td className={`p-3 font-bold ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {product.stock}
                        </td>
                        <td className="text-gray-300 p-3">
                          <span className="flex items-center gap-1">
                            <FiImage />
                            {product.images?.length || 1}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-accent hover:text-accent-strong transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-500 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-6">Contact Messages</h2>
              
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <FiMail size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No messages yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Subject</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((message: any) => (
                        <tr key={message.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                          <td className="py-4 px-4 text-gray-300">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-white">{message.name}</td>
                          <td className="py-4 px-4 text-gray-300">{message.email}</td>
                          <td className="py-4 px-4 text-white">
                            <div>
                              <div className="font-semibold">{message.subject}</div>
                              <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {message.message}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                message.status === 'read'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {message.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedMessage(message);
                                  setShowMessageModal(true);
                                }}
                                className="px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() =>
                                  updateMessageStatusMutation.mutate({
                                    messageId: message.id,
                                    status: message.status === 'read' ? 'unread' : 'read',
                                  })
                                }
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-sm"
                              >
                                {message.status === 'read' ? 'Unread' : 'Read'}
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this message?')) {
                                    deleteMessageMutation.mutate(message.id);
                                  }
                                }}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && selectedMessage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card-glass max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-accent">Message Details</h2>
                  <button
                    onClick={() => {
                      setShowMessageModal(false);
                      setSelectedMessage(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm font-semibold">Date</label>
                    <p className="text-white mt-1">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm font-semibold">Name</label>
                    <p className="text-white mt-1">{selectedMessage.name}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm font-semibold">Email</label>
                    <p className="text-white mt-1">
                      <a href={`mailto:${selectedMessage.email}`} className="text-accent hover:text-accent-strong">
                        {selectedMessage.email}
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm font-semibold">Subject</label>
                    <p className="text-white mt-1 font-semibold">{selectedMessage.subject}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm font-semibold">Message</label>
                    <p className="text-white mt-1 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm font-semibold">Status</label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                          selectedMessage.status === 'read'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {selectedMessage.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      updateMessageStatusMutation.mutate({
                        messageId: selectedMessage.id,
                        status: selectedMessage.status === 'read' ? 'unread' : 'read',
                      });
                      setShowMessageModal(false);
                      setSelectedMessage(null);
                    }}
                    className="btn-gold flex-1"
                  >
                    Mark as {selectedMessage.status === 'read' ? 'Unread' : 'Read'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this message?')) {
                        deleteMessageMutation.mutate(selectedMessage.id);
                        setShowMessageModal(false);
                        setSelectedMessage(null);
                      }
                    }}
                    className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Checkout Settings */}
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-6">Checkout Settings</h2>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Shipping Fee (LKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="input-dark w-full max-w-md"
                    placeholder="Enter shipping fee"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Set to 0 for free shipping. This fee will be added to all orders at checkout.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSavingSettings || saveSettingsMutation.isPending}
                    className="add-to-cart-btn px-8"
                  >
                    {isSavingSettings || saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-6">Change Password</h2>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-dark w-full max-w-md"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-dark w-full max-w-md"
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-dark w-full max-w-md"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="add-to-cart-btn px-8"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Category Management */}
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-6">Category Management</h2>
              
              {/* Add New Category */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <h3 className="text-white font-semibold mb-4">Add New Category</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value.toLowerCase())}
                    className="input-dark flex-1"
                    placeholder="Enter category name (e.g., watch, bracelet)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                          setCategories([...categories, newCategory.trim()]);
                          setNewCategory('');
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                        setCategories([...categories, newCategory.trim()]);
                        setNewCategory('');
                      } else if (categories.includes(newCategory.trim())) {
                        alert('Category already exists');
                      }
                    }}
                    className="btn-gold whitespace-nowrap"
                  >
                    <FiPlus className="inline mr-2" />
                    Add Category
                  </button>
                </div>
              </div>

              {/* Categories List */}
              <h3 className="text-white font-semibold mb-4">Current Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div key={category} className="flex justify-between items-center p-3 bg-white/[0.02] rounded border border-white/5">
                    <span className="text-white capitalize">{category}</span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete category "${category}"? This won't affect existing products.`)) {
                          setCategories(categories.filter(c => c !== category));
                        }
                      }}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin User Management */}
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-6">Admin Users</h2>
              
              {/* Add New Admin */}
              <form onSubmit={handleAddAdmin} className="mb-6 pb-6 border-b border-white/10">
                <h3 className="text-white font-semibold mb-4">Add New Admin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2">Email</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="input-dark w-full"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Password</label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="input-dark w-full"
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="add-to-cart-btn mt-4"
                >
                  <FiPlus className="inline mr-2" />
                  {isAddingAdmin ? 'Adding...' : 'Add Admin User'}
                </button>
              </form>

              {/* Admin Users List */}
              <h3 className="text-white font-semibold mb-4">Current Admin Users</h3>
              {adminUsers.length === 0 ? (
                <p className="text-gray-400">No admin users found</p>
              ) : (
                <div className="space-y-2">
                  {adminUsers.map((admin) => (
                    <div key={admin.uid} className="flex justify-between items-center p-3 bg-white/[0.02] rounded border border-white/5">
                      <span className="text-white">{admin.email}</span>
                      <button
                        onClick={() => handleRemoveAdmin(admin.uid, admin.email)}
                        className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <FiTrash2 size={16} />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Information */}
            <div className="card-glass p-6">
              <h2 className="text-2xl font-bold text-accent mb-4">Security Information</h2>
              <div className="space-y-3 text-gray-300">
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Session timeout: 30 minutes of inactivity
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Firebase authentication enabled
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Secure token-based API access
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Rate limiting protection enabled
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Admin;
