// script.js (module)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ======  STEP: Paste your Firebase config here (from Firebase console)  ======
   const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAckKnAMURHfET5Sm-9pQnG-q5eU8rtS60",
  authDomain: "photos-68aa8.firebaseapp.com",
  projectId: "photos-68aa8",
  storageBucket: "photos-68aa8.firebasestorage.app",
  messagingSenderId: "431660130857",
  appId: "1:431660130857:web:2bf8d56de8ef9d9105f238",
  measurementId: "G-RN8GHC36BZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const photoInput = document.getElementById('photoInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const gallery = document.getElementById('gallery');

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const authStatus = document.getElementById('authStatus');

let currentUser = null;

// Upload flow
uploadBtn.addEventListener('click', async () => {
  const file = photoInput.files[0];
  if (!file) return alert("Please choose a photo file first.");
  uploadStatus.textContent = 'Uploading...';

  try {
    // create a storage ref with unique name
    const name = `photos/${Date.now()}-${file.name}`;
    const sRef = storageRef(storage, name);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);

    // store meta in Firestore
    await addDoc(collection(db, "photos"), {
      url,
      path: name,
      createdAt: serverTimestamp()
    });

    uploadStatus.textContent = 'Upload complete!';
    photoInput.value = '';
    displayPhotos();
  } catch (err) {
    console.error(err);
    uploadStatus.textContent = 'Upload failed: ' + (err.message || err);
  }

  setTimeout(()=> uploadStatus.textContent = '', 3000);
});

// Display photos
async function displayPhotos() {
  gallery.innerHTML = '<p class="info">Loading gallery…</p>';
  try {
    const snapshot = await getDocs(collection(db, "photos"));
    gallery.innerHTML = '';
    if (snapshot.empty) {
      gallery.innerHTML = '<p class="info">No photos yet. Be the first to upload!</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.innerHTML = `
        <img src="${data.url}" alt="photo">
        <div class="photo-meta">Uploaded: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : '—'}</div>
        <button class="delete-btn" data-id="${id}" data-path="${data.path}">Delete</button>
      `;
      gallery.appendChild(card);
    });

    updateDeleteButtonsVisibility();
    attachDeleteHandlers();
  } catch (err) {
    console.error(err);
    gallery.innerHTML = '<p class="info">Failed to load gallery.</p>';
  }
}

// Delete handlers (admin only)
function attachDeleteHandlers() {
  const buttons = document.querySelectorAll('.delete-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!currentUser) return alert('Only admin can delete photos.');
      const id = btn.getAttribute('data-id');
      const path = btn.getAttribute('data-path');
      if (!confirm('Delete this photo permanently?')) return;

      try {
        // delete from storage and firestore
        const sRef = storageRef(storage, path);
        await deleteObject(sRef);
        await deleteDoc(doc(db, "photos", id));
        displayPhotos();
      } catch (err) {
        console.error(err);
        alert('Delete failed: ' + (err.message || err));
      }
    });
  });
}

function updateDeleteButtonsVisibility() {
  const isAdmin = !!currentUser;
  document.querySelectorAll('.delete-btn').forEach(b => {
    b.style.display = isAdmin ? 'block' : 'none';
  });
}

// Auth: login/logout
loginBtn.addEventListener('click', async () => {
  const email = adminEmail.value.trim();
  const pass = adminPassword.value;
  if (!email || !pass) return alert('Enter admin email & password.');
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    authStatus.textContent = 'Login failed: ' + err.message;
    setTimeout(()=> authStatus.textContent = '', 4000);
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

// Auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authStatus.textContent = `Logged in as ${user.email}`;
    logoutBtn.style.display = 'inline';
    loginBtn.style.display = 'none';
    adminEmail.style.display = 'none';
    adminPassword.style.display = 'none';
  } else {
    authStatus.textContent = '';
    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline';
    adminEmail.style.display = 'inline';
    adminPassword.style.display = 'inline';
  }
  updateDeleteButtonsVisibility();
});

// Initial load
displayPhotos();
