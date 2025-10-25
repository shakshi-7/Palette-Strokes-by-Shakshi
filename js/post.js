// js/post.js
// Handles loading a single blog post dynamically from Firebase

import { db, initAuth, doc, getDoc, appId, collection } from './firebase-init.js';

// Function to format Firestore Timestamp to a readable date
function formatDate(timestamp) {
    if (!timestamp) return "Date unknown";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to fetch and display the blog post
async function loadPost() {
    console.log("Initializing auth for post page...");
    await initAuth(); // Ensure user is signed in (even anonymously)
    console.log("Auth initialized.");

    const loadingSkeleton = document.getElementById('post-loading');
    
    // Get post ID from URL
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        showError("Post not found. No ID provided.");
        return;
    }

    console.log(`Fetching post with ID: ${postId}`);

    try {
        // Construct the collection path
        const collectionPath = `/artifacts/${appId}/public/data/blogPosts`;
        
        // Get a reference to the specific document
        const postRef = doc(db, collectionPath, postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const post = postSnap.data();
            console.log("Post data found:", post);

            // Hide loading skeleton
            loadingSkeleton.style.display = 'none';

            // Populate the page elements
            const titleEl = document.getElementById('post-title');
            const metaEl = document.getElementById('post-meta');
            const dateEl = document.getElementById('post-date');
            const authorEl = document.getElementById('post-author');
            const imageEl = document.getElementById('post-image');
            const contentEl = document.getElementById('post-content');

            document.title = `${post.title} - Palette Strokes`;
            titleEl.textContent = post.title;
            dateEl.textContent = `📅 ${formatDate(post.publicationDate)}`;
            authorEl.textContent = `✍️ ${post.author}`;
            
            imageEl.src = post.imageUrl;
            imageEl.alt = post.title;
            
            // Use innerHTML to render the saved HTML content
            contentEl.innerHTML = post.content;

            // Show populated elements
            titleEl.style.display = 'block';
            metaEl.style.display = 'block';
            imageEl.style.display = 'block';
            contentEl.style.display = 'block';

        } else {
            console.error("No such document!");
            showError("Sorry, this post could not be found.");
        }
    } catch (error) {
        console.error("Error getting document:", error);
        showError("There was an error loading this post. Please try again later.");
    }
}

// Function to display an error message
function showError(message) {
    const container = document.getElementById('post-container');
    const loadingSkeleton = document.getElementById('post-loading');
    
    // Hide skeleton
    if (loadingSkeleton) {
        loadingSkeleton.style.display = 'none';
    }

    container.innerHTML = `
        <a href="blog.html" class="back-link">&larr; Back to all posts</a>
        <h1 class="post-title">Error</h1>
        <p class="post-content">${message}</p>
    `;
}

// Run the script when the DOM is loaded
document.addEventListener('DOMContentLoaded', loadPost);
