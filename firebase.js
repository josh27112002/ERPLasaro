// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Configuración
const firebaseConfig = {
  apiKey: "AIzaSyD0P6AS8Ej9mnUo3EUOHmzTtMrnJN7nA_E",
  authDomain: "erpy-11103.firebaseapp.com",
  projectId: "erpy-11103",
  storageBucket: "erpy-11103.appspot.com", // ⚠️ corregido: .app → .appspot.com
  messagingSenderId: "699852482039",
  appId: "1:699852482039:web:8b225ced1799aa2c4d3af2",
  measurementId: "G-1J3MEXT9JN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // ✅ Inicializar Storage

export {
  app,
  db,
  auth,
  storage, // ✅ Exportar Storage
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
};
