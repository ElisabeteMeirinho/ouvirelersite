
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDKRn1M5HvCRo9dtCWFP3adepUEe7lBbvg",
  authDomain: "ouvir-e-ler.firebaseapp.com",
  projectId: "ouvir-e-ler",
  storageBucket: "ouvir-e-ler.firebasestorage.app",
  messagingSenderId: "1032722618943",
  appId: "1:1032722618943:web:21d05ad36b46290ca6b68a",
  measurementId: "G-V167H5ZQLV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth, db,
  signInAnonymously, onAuthStateChanged,
  collection, addDoc, onSnapshot,
  doc, setDoc, getDoc, serverTimestamp
};
