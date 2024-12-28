// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore} from 'firebase/firestore'
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdDDNRvAwiOz9gjQtyv5yGdjUKQ8cd7bs",
  authDomain: "pteshadowing.firebaseapp.com",
  projectId: "pteshadowing",
  storageBucket: "pteshadowing.appspot.com",
  messagingSenderId: "1030709369202",
  appId: "1:1030709369202:web:f5c029e87f836c013ba5eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Add initialization logging
console.log('Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

export const db = getFirestore(app)
console.log('Firestore initialized');

export const storage = getStorage(app);
console.log('Firebase Storage initialized');
