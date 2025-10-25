// js/firebase-init.js
// This new file initializes Firebase and exports key services.

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// --- START: PASTE YOUR FIREBASE CONFIG HERE ---
// Get this from your Firebase project console
// NOTE: I'm using the placeholder config from your file.
// Remember to replace it with your *actual* Firebase config.
const firebaseConfig = {
    apiKey: "AIzaSyAJ5u_oenU0adpA4rnXya3fGVOE-T1Ru78",
    authDomain: "palette-strokes.firebaseapp.com",
    projectId: "palette-strokes",
    storageBucket: "palette-strokes.firebasestorage.app",
    messagingSenderId: "676101147693",
    appId: "1:676101147693:web:1c15a9b71107c8dd423ca4",
    measurementId: "G-BQ4QDJKZ38"
  };
// --- END: PASTE YOUR FIREBASE CONFIG HERE ---

// Get App ID from canvas environment or use a default
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
let app;
let db;
let auth;

try {
    // Get config from canvas environment if available
    const envConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
    
    app = initializeApp(envConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Set log level for debugging
    setLogLevel('Debug');
    
} catch (e) {
    console.error("Error initializing Firebase:", e);
    // Display a friendly error to the user on the page
    document.body.innerHTML = `<div style="padding: 40px; text-align: center; font-family: sans-serif; background: #fff1f1; color: #d90000; border-radius: 8px; margin: 20px;">
        <h2>Firebase Initialization Error</h2>
        <p>Could not connect to Firebase. Please check your Firebase project configuration in <strong>js/firebase-init.js</strong>.</p>
        <p><strong>Error details:</strong> ${e.message}</p>
        </div>`;
}


// Function to get the current user ID or a random one for anonymous users
function getUserId() {
    return auth.currentUser?.uid || crypto.randomUUID();
}

// Function to initialize authentication
// This handles the token provided by the canvas environment
async function initAuth() {
    return new Promise((resolve) => {
        if (!auth) {
            console.error("Firebase Auth is not initialized.");
            return resolve(null);
        }
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        console.log("Signing in with custom token...");
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        console.log("Signing in anonymously...");
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Authentication error:", error);
                }
            } else {
                 console.log("User is already signed in:", user.uid);
            }
            resolve(auth.currentUser);
        });
    });
}

// Export the services and helper functions to be used in other scripts
export {
    db,
    auth,
    appId,
    getUserId,
    initAuth,
    // Firestore functions
    doc,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    serverTimestamp,
    // Auth functions
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
};
