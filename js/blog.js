// js/blog.js
// Handles dynamically loading blog posts from Firebase

import { db, initAuth, collection, onSnapshot, appId } from './firebase-init.js';

// --- STATE ---
let allPosts = []; // Local cache of all posts from Firebase
let filteredPosts = [];

// --- ELEMENTS ---
let blogGrid, searchInput, loadingIndicator, noResultsMessage;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initBlogPage);

async function initBlogPage() {
    blogGrid = document.getElementById('blog-grid-container');
    searchInput = document.getElementById('blog-search-input');
    loadingIndicator = document.getElementById('blog-loading');
    noResultsMessage = document.getElementById('no-results-message');

    if (!blogGrid) {
        console.error('Blog grid container not found!');
        return;
    }

    console.log('Initializing Blog Page...');
    // Ensure user is authenticated (even anonymously) before fetching data
    await initAuth();
    console.log('Auth initialized. Loading blog posts...');
    
    loadBlogPosts(); // Load posts from Firebase

    // Add search listener
    searchInput.addEventListener('input', (e) => {
        filterBlogPosts(e.target.value);
    });
}

// --- DATA LOADING ---
function loadBlogPosts() {
    const collectionPath = `/artifacts/${appId}/public/data/blogPosts`;
    
    onSnapshot(collection(db, collectionPath), (snapshot) => {
        console.log(`Received ${snapshot.size} blog posts.`);
        
        allPosts = []; // Clear local cache
        if (snapshot.empty) {
            console.log("No posts found.");
            loadingIndicator.style.display = 'none';
            noResultsMessage.textContent = 'No blog posts have been added yet.';
            noResultsMessage.style.display = 'block';
            return;
        }

        snapshot.forEach((doc) => {
            allPosts.push({ id: doc.id, ...doc.data() });
        });

        // Sort posts by date, newest first
        allPosts.sort((a, b) => b.publicationDate.toDate() - a.publicationDate.toDate());

        // Initial render
        filterBlogPosts(searchInput.value);

    }, (error) => {
        console.error("Error loading blog posts: ", error);
        loadingIndicator.style.display = 'none';
        noResultsMessage.textContent = 'Error loading blog posts. Please try again later.';
        noResultsMessage.style.display = 'block';
        showNotification('Error loading blog posts', 'error');
    });
}

// --- SEARCH & FILTERING ---
function filterBlogPosts(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    if (term === '') {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(term) ||
            post.content.toLowerCase().includes(term) ||
            post.author.toLowerCase().includes(term)
        );
    }
    
    renderBlogPosts();
}

// --- RENDERING ---
function renderBlogPosts() {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
    
    // Clear the grid
    blogGrid.innerHTML = ''; 

    if (filteredPosts.length === 0) {
        noResultsMessage.textContent = 'No blog posts found. Try a different search term.';
        noResultsMessage.style.display = 'block';
        return;
    }

    // Show posts
    noResultsMessage.style.display = 'none';
    filteredPosts.forEach(post => {
        const card = createBlogCard(post);
        blogGrid.appendChild(card);
    });
}

// --- HTML TEMPLATE ---
function createBlogCard(post) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    
    // Format date
    const date = post.publicationDate ? post.publicationDate.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';
    
    // Create a snippet from the content (first ~150 chars)
    // Strip HTML tags for the snippet
    const snippet = post.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

    article.innerHTML = `
        <img src="${post.imageUrl}" alt="${post.title}" class="blog-image" onerror="this.src='https://placehold.co/600x400/f5f3f0/333?text=Image+Missing'">
        <div class="blog-content">
            <div class="blog-meta">
                <span>📅 ${date}</span>
                <span>✍️ ${post.author}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${snippet}</p>
            <a href="post.html?id=${post.id}">
                Read More
                <span>→</span>
            </a>
        </div>
    `;
    
    return article;
}
