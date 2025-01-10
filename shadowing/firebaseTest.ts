import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { storage } from './firebase'; // Keep using original storage

// Test project Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpleQWpPrzN-5KOxAVwyLJDewRrFVljhM",
  authDomain: "testing-2920a.firebaseapp.com",
  projectId: "testing-2920a",
  storageBucket: "testing-2920a.firebasestorage.app",
  messagingSenderId: "251830653553",
  appId: "1:251830653553:web:a39ec4051bfa15d4ff41d0",
  measurementId: "G-7VG56W2VX9"
};

// Initialize Firebase
const testApp = initializeApp(firebaseConfig, 'test');
const testDb = getFirestore(testApp);

export { testDb, storage };
