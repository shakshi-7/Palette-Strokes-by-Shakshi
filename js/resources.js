// js/resources.js
// Handles dynamically loading products from Firebase

import { db, initAuth, collection, onSnapshot, appId } from './firebase-init.js';

// --- STATE ---
let allProducts = []; // Local cache
let filteredProducts = [];

// --- ELEMENTS ---
let productGrid, searchInput, categoryFilter, loadingIndicator, noResultsMessage;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initResourcesPage);

async function initResourcesPage() {
    productGrid = document.getElementById('product-grid-container');
    searchInput = document.getElementById('product-search-input');
    categoryFilter = document.getElementById('product-category-filter');
    loadingIndicator = document.getElementById('product-loading');
    noResultsMessage = document.getElementById('no-results-message-product');

    if (!productGrid) {
        console.error('Product grid container not found!');
        return;
    }

    console.log('Initializing Resources Page...');
    await initAuth();
    console.log('Auth initialized. Loading products...');
    
    loadProducts(); // Load products from Firebase

    // Add filter listeners
    searchInput.addEventListener('input', runFilters);
    categoryFilter.addEventListener('change', runFilters);
}

// --- DATA LOADING ---
function loadProducts() {
    const collectionPath = `/artifacts/${appId}/public/data/products`;
    
    onSnapshot(collection(db, collectionPath), (snapshot) => {
        console.log(`Received ${snapshot.size} products.`);
        
        allProducts = []; // Clear local cache
        if (snapshot.empty) {
            console.log("No products found.");
            loadingIndicator.style.display = 'none';
            noResultsMessage.textContent = 'No products have been added yet.';
            noResultsMessage.style.display = 'block';
            return;
        }

        snapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        // Sort by name by default
        allProducts.sort((a, b) => a.name.localeCompare(b.name));

        // Initial render
        runFilters();

    }, (error) => {
        console.error("Error loading products: ", error);
        loadingIndicator.style.display = 'none';
        noResultsMessage.textContent = 'Error loading products. Please try again later.';
        noResultsMessage.style.display = 'block';
        showNotification('Error loading products', 'error');
    });
}

// --- SEARCH & FILTERING ---
function runFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    filteredProducts = allProducts.filter(product => {
        const matchesCategory = (category === 'All Categories' || product.category === category);
        
        const matchesSearch = (
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
        
        return matchesCategory && matchesSearch;
    });
    
    renderProducts();
}

// --- RENDERING ---
function renderProducts() {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
    
    // Clear the grid
    productGrid.innerHTML = ''; 

    if (filteredProducts.length === 0) {
        noResultsMessage.textContent = 'No products found. Try adjusting your search or filter.';
        noResultsMessage.style.display = 'block';
        return;
    }

    // Show products
    noResultsMessage.style.display = 'none';
    filteredProducts.forEach(product => {
        const card = createProductCard(product);
        productGrid.appendChild(card);
    });
}

// --- HTML TEMPLATE ---
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://placehold.co/400x400/f5f3f0/333?text=Image+Missing'">
        <div class="product-info">
            <div class="product-header">
                <h3>${product.name}</h3>
                <span class="product-tag">${product.category}</span>
            </div>
            <p class="product-author">by ${product.brand}</p>
            <p>${product.description}</p>
            <a href="${product.link}" class="product-btn" target="_blank" rel="noopener noreferrer">
                View Product
                <span>↗</span>
            </a>
        </div>
    `;
    
    return card;
}
