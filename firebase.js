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

// Configuración
const firebaseConfig = {
  apiKey: "AIzaSyD1vKs3CSDUbvU3XaFHzX_hmdq05ga2TUE",
  authDomain: "erpj-3f6b7.firebaseapp.com",
  projectId: "erpj-3f6b7",
  storageBucket: "erpj-3f6b7.appspot.com",
  messagingSenderId: "277321931724",
  appId: "1:277321931724:web:52b2aa01f80ac816109b69"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  app,
  db,
  auth,
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
