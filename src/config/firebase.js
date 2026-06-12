// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBloyHTSQmpoWjj-LU0_gC_ceWRcbAnvRE",
  authDomain: "cupcake-private-world-82cf0.firebaseapp.com",
  projectId: "cupcake-private-world-82cf0",
  storageBucket: "cupcake-private-world-82cf0.firebasestorage.app",
  messagingSenderId: "780673797768",
  appId: "1:780673797768:web:1cc09a92d5e7c71febd93d",
  measurementId: "G-LWJY8XZX31"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// After your app initialization:
export const storage = getStorage(app);
export { signInWithPopup, signOut };