import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2lnYtfrjAekULYI77IodRYx3AgeImfmA",
  authDomain: "cindex-14561.firebaseapp.com",
  projectId: "cindex-14561",
  storageBucket: "cindex-14561.firebasestorage.app",
  messagingSenderId: "59278063068",
  appId: "1:59278063068:web:d57e5bb00b7e0316474b19",
  measurementId: "G-MCMQ2L2777",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services to import in other files
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);