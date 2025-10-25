// js/admin.js
// Handles admin authentication and content management with Firebase

import {
    db,
    auth,
    appId,
    initAuth,
    collection,
    addDoc,
    setDoc,
    doc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from './firebase-init.js';

// --- STATE ---
let isAuthenticated = false;
let currentBlogPosts = [];
let currentProducts = [];
let currentEditBlogId = null;
let currentEditProductId = null;

// --- COLLECTIONS ---
const blogCollectionPath = `/artifacts/${appId}/public/data/blogPosts`;
const productCollectionPath = `/artifacts/${appId}/public/data/products`;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initAdminPage);

async function initAdminPage() {
    console.log('Admin page initializing with Firebase...');
    
    // Auth notice elements
    const authNotice = document.getElementById('auth-notice');
    const loginButton = document.getElementById('login-btn-main');
    
    // Form elements
    const blogForm = document.getElementById('blog-form');
    const productForm = document.getElementById('product-form');
    const blogFormCancel = document.getElementById('blog-form-cancel');
    const productFormCancel = document.getElementById('product-form-cancel');

    // Attach listeners
    loginButton?.addEventListener('click', showLoginModal);
    blogForm?.addEventListener('submit', handleBlogSubmit);
    productForm?.addEventListener('submit', handleProductSubmit);
    blogFormCancel?.addEventListener('click', resetBlogForm);
    productFormCancel?.addEventListener('click', resetProductForm);

    // Initialize Auth State Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is signed in:', user.email);
            isAuthenticated = true;
            showAuthStatus(true, user.email);
            // Load data only when authenticated
            loadExistingData();
        } else {
            console.log('User is signed out.');
            isAuthenticated = false;
            showAuthStatus(false);
            // Clear data if logged out
            clearAdminLists();
        }
    });

    // Run initial auth check (handles anonymous or custom token)
    await initAuth();
    console.log('Initial auth check complete.');
}

// --- AUTHENTICATION ---

function showAuthStatus(authenticated, email = '') {
    const authNotice = document.getElementById('auth-notice');
    const userStat = document.getElementById('stats-user');

    if (authenticated) {
        authNotice.innerHTML = `
            <div class="auth-icon" style="background: #4CAF50;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h3>Authenticated</h3>
            <p>Signed in as <strong>${email}</strong>. You can now manage content.</p>
            <button class="btn" id="logout-btn" style="margin-top: 15px; background: #ff4444; color: #fff;">Logout</button>
        `;
        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        userStat.textContent = 'Logged In';
    } else {
        authNotice.innerHTML = `
            <div class="auth-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <h3>Authentication Required</h3>
            <p>Please log in to manage your website content.</p>
            <button class="btn" id="login-btn-main" style="margin-top: 15px;">Login</button>
        `;
        document.getElementById('login-btn-main')?.addEventListener('click', showLoginModal);
        userStat.textContent = 'Logged Out';
    }
}

function showLoginModal() {
    // Check if modal already exists
    if (document.querySelector('.login-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeLoginModal()">×</button>
            <div class="modal-body">
                <h2>Admin Login</h2>
                <p>Enter your credentials to access the admin dashboard</p>
                <form id="loginForm">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="adminEmail" placeholder="admin@palettestokes.com" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="adminPassword" placeholder="admin123" required>
                    </div>
                    <button type="submit" class="submit-btn">Login</button>
                    <p id="login-error" class="error-message" style="margin-top: 15px; display: none;"></p>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';

    // Add submit listener
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    // Make close function global
    window.closeLoginModal = closeLoginModal;
}

function closeLoginModal() {
    const modal = document.querySelector('.login-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const submitBtn = event.target.querySelector('.submit-btn');
    const errorEl = document.getElementById('login-error');

    setLoadingState(submitBtn, true, 'Logging in...');
    errorEl.style.display = 'none';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth state listener in initAdminPage will handle the success UI
        setLoadingState(submitBtn, false);
        closeLoginModal();
        showNotification('Login successful!');
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = `Login failed: ${error.message}`;
        errorEl.style.display = 'block';
        setLoadingState(submitBtn, false);
        showNotification('Invalid credentials. Please try again.', 'error');
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        // Auth state listener will handle UI changes
        showNotification('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out.', 'error');
    }
}


// --- DATA MANAGEMENT ---

function loadExistingData() {
    console.log("Loading existing data...");
    
    // Load Blog Posts
    const blogList = document.getElementById('blog-items-list');
    const blogLoading = document.getElementById('blog-list-loading');
    
    onSnapshot(collection(db, blogCollectionPath), (snapshot) => {
        console.log(`Received ${snapshot.size} blog posts.`);
        blogLoading.style.display = 'none';
        blogList.innerHTML = ''; // Clear list
        currentBlogPosts = []; // Reset local cache

        if (snapshot.empty) {
            blogList.innerHTML = '<p>No blog posts found.</p>';
        }
        
        snapshot.forEach((doc) => {
            const post = { id: doc.id, ...doc.data() };
            currentBlogPosts.push(post);
            const postEl = createItemRow(post, 'blog');
            blogList.appendChild(postEl);
        });
        updateStatistics();
    }, (error) => {
        console.error("Error loading blog posts: ", error);
        blogLoading.textContent = 'Error loading blog posts.';
        showNotification('Error loading blog posts', 'error');
    });

    // Load Products
    const productList = document.getElementById('product-items-list');
    const productLoading = document.getElementById('product-list-loading');
    
    onSnapshot(collection(db, productCollectionPath), (snapshot) => {
        console.log(`Received ${snapshot.size} products.`);
        productLoading.style.display = 'none';
        productList.innerHTML = ''; // Clear list
        currentProducts = []; // Reset local cache
        
        if (snapshot.empty) {
            productList.innerHTML = '<p>No products found.</p>';
        }

        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            currentProducts.push(product);
            const productEl = createItemRow(product, 'product');
            productList.appendChild(productEl);
        });
        updateStatistics();
    }, (error) => {
        console.error("Error loading products: ", error);
        productLoading.textContent = 'Error loading products.';
        showNotification('Error loading products', 'error');
    });
}

function clearAdminLists() {
    document.getElementById('blog-items-list').innerHTML = '<p>Please log in to view posts.</p>';
    document.getElementById('product-items-list').innerHTML = '<p>Please log in to view products.</p>';
    document.getElementById('stats-blog-posts').textContent = '0';
    document.getElementById('stats-products').textContent = '0';
    currentBlogPosts = [];
    currentProducts = [];
}

// --- FORM SUBMISSIONS ---

async function handleBlogSubmit(event) {
    event.preventDefault();
    if (!isAuthenticated) {
        showNotification('Please login to manage posts', 'error');
        return;
    }

    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    setLoadingState(submitBtn, true, 'Saving...');

    const blogData = {
        title: form.blogTitle.value,
        author: form.blogAuthor.value,
        imageUrl: form.blogImage.value,
        content: form.blogContent.value,
        publicationDate: new Date(form.blogDate.value),
        category: form.blogCategory.value,
        updatedAt: serverTimestamp()
    };

    try {
        if (currentEditBlogId) {
            // Update existing document
            const docRef = doc(db, blogCollectionPath, currentEditBlogId);
            await setDoc(docRef, blogData, { merge: true });
            showNotification('Blog post updated successfully!');
        } else {
            // Add new document
            blogData.createdAt = serverTimestamp();
            await addDoc(collection(db, blogCollectionPath), blogData);
            showNotification('Blog post published successfully!');
        }
        resetBlogForm();
    } catch (error) {
        console.error("Error saving blog post: ", error);
        showNotification('Error saving post. See console.', 'error');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

async function handleProductSubmit(event) {
    event.preventDefault();
    if (!isAuthenticated) {
        showNotification('Please login to manage products', 'error');
        return;
    }

    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    setLoadingState(submitBtn, true, 'Saving...');

    const productData = {
        name: form.productName.value,
        brand: form.productBrand.value,
        description: form.productDescription.value,
        imageUrl: form.productImage.value,
        link: form.productLink.value,
        category: form.productCategory.value,
        price: form.productPrice.value,
        updatedAt: serverTimestamp()
    };

    try {
        if (currentEditProductId) {
            // Update
            const docRef = doc(db, productCollectionPath, currentEditProductId);
            await setDoc(docRef, productData, { merge: true });
            showNotification('Product updated successfully!');
        } else {
            // Add new
            productData.createdAt = serverTimestamp();
            await addDoc(collection(db, productCollectionPath), productData);
            showNotification('Product added successfully!');
        }
        resetProductForm();
    } catch (error) {
        console.error("Error saving product: ", error);
        showNotification('Error saving product. See console.', 'error');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

// --- ITEM RENDERING & ACTIONS ---

function createItemRow(item, type) {
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.dataset.id = item.id;
    
    let title, meta;
    if (type === 'blog') {
        title = item.title;
        const date = item.publicationDate ? item.publicationDate.toDate().toLocaleDateString() : 'N/A';
        meta = `Published: ${date} • By ${item.author}`;
    } else {
        title = item.name;
        meta = `Category: ${item.category} • By ${item.brand}`;
    }

    itemRow.innerHTML = `
        <div class="item-info">
            <h4>${title}</h4>
            <p>${meta}</p>
        </div>
        <div class="item-actions">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;
    
    // Add event listeners
    itemRow.querySelector('.edit-btn').addEventListener('click', () => {
        if (type === 'blog') editBlogPost(item);
        if (type === 'product') editProduct(item);
    });
    
    itemRow.querySelector('.delete-btn').addEventListener('click', () => {
        if (type === 'blog') deleteBlogPost(item);
        if (type === 'product') deleteProduct(item);
    });

    return itemRow;
}

// --- EDIT & DELETE FUNCTIONS ---

function editBlogPost(post) {
    if (!isAuthenticated) return;
    
    const form = document.getElementById('blog-form');
    form.blogTitle.value = post.title;
    form.blogAuthor.value = post.author;
    form.blogImage.value = post.imageUrl;
    form.blogContent.value = post.content;
    form.blogDate.value = post.publicationDate.toDate().toISOString().split('T')[0]; // Format for date input
    form.blogCategory.value = post.category;
    
    currentEditBlogId = post.id;
    
    form.querySelector('.submit-btn').textContent = 'Update Blog Post';
    document.getElementById('blog-form-cancel').style.display = 'inline-block';
    form.scrollIntoView({ behavior: 'smooth' });
}

function resetBlogForm() {
    const form = document.getElementById('blog-form');
    form.reset();
    currentEditBlogId = null;
    form.querySelector('.submit-btn').textContent = 'Publish Blog Post';
    document.getElementById('blog-form-cancel').style.display = 'none';
}

function editProduct(product) {
    if (!isAuthenticated) return;

    const form = document.getElementById('product-form');
    form.productName.value = product.name;
    form.productBrand.value = product.brand;
    form.productDescription.value = product.description;
    form.productImage.value = product.imageUrl;
    form.productLink.value = product.link;
    form.productCategory.value = product.category;
    form.productPrice.value = product.price;

    currentEditProductId = product.id;

    form.querySelector('.submit-btn').textContent = 'Update Product';
    document.getElementById('product-form-cancel').style.display = 'inline-block';
    form.scrollIntoView({ behavior: 'smooth' });
}

function resetProductForm() {
    const form = document.getElementById('product-form');
    form.reset();
    currentEditProductId = null;
    form.querySelector('.submit-btn').textContent = 'Add Product';
    document.getElementById('product-form-cancel').style.display = 'none';
}

async function deleteBlogPost(post) {
    if (!isAuthenticated) return;
    
    if (confirm(`Are you sure you want to delete:\n"${post.title}"?`)) {
        try {
            await deleteDoc(doc(db, blogCollectionPath, post.id));
            showNotification('Blog post deleted.');
            // onSnapshot listener will update the list
        } catch (error) {
            console.error("Error deleting post: ", error);
            showNotification('Error deleting post.', 'error');
        }
    }
}

async function deleteProduct(product) {
    if (!isAuthenticated) return;

    if (confirm(`Are you sure you want to delete:\n"${product.name}"?`)) {
        try {
            await deleteDoc(doc(db, productCollectionPath, product.id));
            showNotification('Product deleted.');
            // onSnapshot listener will update the list
        } catch (error) {
            console.error("Error deleting product: ", error);
            showNotification('Error deleting product.', 'error');
        }
    }
}

// --- UTILITIES ---

function updateStatistics() {
    document.getElementById('stats-blog-posts').textContent = currentBlogPosts.length;
    document.getElementById('stats-products').textContent = currentProducts.length;
}

// Make functions globally available if needed (for inline modal close)
window.closeLoginModal = closeLoginModal;
