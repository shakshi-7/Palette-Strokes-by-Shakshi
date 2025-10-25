// contact.js - JavaScript for Contact Page
// Handles contact form validation, submission, and interactions
// This version is updated to import from firebase-init.js and remove redundant helpers

// Import just what's needed. We'll use global helpers for showNotification etc.
import { db, initAuth, addDoc, collection, serverTimestamp, appId } from './firebase-init.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initContactPage);

async function initContactPage() {
    // Wait for anonymous auth before enabling form
    try {
        await initAuth();
        console.log("Contact page auth initialized.");
        initContactForm();
        initFormValidation();
        initCharacterCount();
        initEmailCopy();
        initAutoSave();
    } catch (error) {
        console.error("Auth failed on contact page:", error);
        // Optionally disable the form
        const submitBtn = document.querySelector('.contact-form .submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Form disabled';
            showNotification('Error connecting to server. Please try again later.', 'error');
        }
    }
    console.log('Contact page initialized');
}

// --- FORM HANDLING ---

function initContactForm() {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateContactForm(this)) {
                submitContactForm(this);
            }
        });
    }
}

async function submitContactForm(form) {
    const submitBtn = form.querySelector('.submit-btn');
    setLoadingState(submitBtn, true, 'Sending...');

    const formData = {
        name: form.querySelector('input[type="text"]').value,
        email: form.querySelector('input[type="email"]').value,
        subject: form.querySelector('input[placeholder*="What"]').value,
        message: form.querySelector('textarea').value,
        createdAt: serverTimestamp()
    };

    try {
        // Save the contact message to a private collection for the user (admin)
        // We'll use the 'contactSubmissions' collection
        const collectionPath = `/artifacts/${appId}/public/data/contactSubmissions`;
        await addDoc(collection(db, collectionPath), formData);

        setLoadingState(submitBtn, false);
        showSuccessMessage();
        form.reset();
        
        // Clear auto-saved data
        clearAutoSave(form);
        
        console.log('Form submission saved to Firebase:', formData);

    } catch (error) {
        console.error("Error submitting form to Firebase: ", error);
        setLoadingState(submitBtn, false);
        showNotification('Error sending message. Please try again.', 'error');
    }
}

// --- VALIDATION ---

function validateContactForm(form) {
    let isValid = true;
    clearFormErrors(form);

    const nameInput = form.querySelector('input[type="text"]');
    const emailInput = form.querySelector('input[type="email"]');
    const subjectInput = form.querySelector('input[placeholder*="What"]');
    const messageInput = form.querySelector('textarea');

    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        showFieldError(nameInput, 'Name must be at least 2 characters');
        isValid = false;
    }
    if (!emailInput.value.trim() || !validateEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    if (!subjectInput.value.trim()) {
        showFieldError(subjectInput, 'Please enter a subject');
        isValid = false;
    }
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
        showFieldError(messageInput, 'Message must be at least 10 characters');
        isValid = false;
    }
    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    field.classList.add('error');
    if (!formGroup.querySelector('.error-message')) {
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        formGroup.appendChild(errorMsg);
    }
}

function clearFormErrors(form) {
    form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    form.querySelectorAll('.error-message').forEach(msg => msg.remove());
}

function initFormValidation() {
    const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) validateField(this);
        });
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMsg = this.closest('.form-group').querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.type === 'email' && !validateEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    } else if (field.tagName === 'TEXTAREA' && value.length < 10) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters';
    } else if (field.type === 'text' && value.length < 2 && field.hasAttribute('required')) {
         isValid = false;
         errorMessage = 'This field must be at least 2 characters';
    }
    if (!isValid) showFieldError(field, errorMessage);
    return isValid;
}

// --- UI & UX HELPERS ---

function showSuccessMessage() {
    let successMsg = document.querySelector('.success-message');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = `
            <div class="success-content">
                <div class="success-icon">✓</div>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for reaching out. I'll get back to you as soon as possible.</p>
            </div>
        `;
        document.body.appendChild(successMsg);
    }
    
    setTimeout(() => successMsg.classList.add('show'), 100);
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 5000);
}

function initCharacterCount() {
    const messageField = document.querySelector('.contact-form textarea');
    if (messageField) {
        let charCount = messageField.parentElement.querySelector('.char-count');
        if (!charCount) {
            charCount = document.createElement('div');
            charCount.className = 'char-count';
            messageField.parentElement.appendChild(charCount);
        }
        
        const updateCount = () => {
            const count = messageField.value.length;
            charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
            charCount.style.color = (count < 10 && count > 0) ? '#ff4444' : '#999';
        };
        
        messageField.addEventListener('input', updateCount);
        updateCount(); // Run on init
    }
}

function initAutoSave() {
    const form = document.querySelector('.contact-form form');
    if (!form) return;
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(`contact_${input.name}`);
        if (savedValue) input.value = savedValue;
        input.addEventListener('input', function() {
            localStorage.setItem(`contact_${this.name}`, this.value);
        });
    });
}

function clearAutoSave(form) {
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        localStorage.removeItem(`contact_${input.name}`);
    });
}

function initEmailCopy() {
    document.querySelectorAll('.contact-method a[href^="mailto:"]').forEach(link => {
        let copyBtn = link.parentElement.querySelector('.copy-email-btn');
        if (!copyBtn) {
            copyBtn = document.createElement('button');
            copyBtn.className = 'copy-email-btn';
            copyBtn.innerHTML = '📋 Copy';
            copyBtn.style.marginLeft = '10px';
            copyBtn.style.background = '#f0f0f0';
            copyBtn.style.border = '1px solid #ddd';
            copyBtn.style.padding = '4px 8px';
            copyBtn.style.borderRadius = '4px';
            copyBtn.style.cursor = 'pointer';
            link.parentElement.appendChild(copyBtn);
            
            copyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigator.clipboard.writeText(link.textContent).then(() => {
                    this.innerHTML = '✓ Copied!';
                    setTimeout(() => { this.innerHTML = '📋 Copy'; }, 2000);
                });
            });
        }
    });
}
