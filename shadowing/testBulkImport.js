import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc, getDocs, query, limit } from 'firebase/firestore';
import { mockAudioSamples } from './mockData.js';

console.log('Starting bulk import test...');
console.log(`Total documents to import: ${mockAudioSamples.length}`);

// Firebase configuration for testing project
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to verify the import by reading documents
async function verifyImport(db) {
  try {
    const q = query(collection(db, 'audioSamples'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      console.log('Verification successful - Sample document:', {
        id: doc.id,
        data: doc.data()
      });
      return true;
    } else {
      console.log('Verification failed - No documents found');
      return false;
    }
  } catch (error) {
    console.error('Error during verification:', error);
    return false;
  }
}

// Function to perform bulk import using batched writes
async function bulkImport() {
  console.log('Initializing Firebase...');
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'audioSamples');
    
    mockAudioSamples.forEach((sample, index) => {
      const docRef = doc(collectionRef); // Auto-generate ID
      batch.set(docRef, sample);
      console.log(`Added document ${index + 1} to batch`);
    });

    // Commit the batch
    console.log('Committing batch write...');
    await batch.commit();
    console.log('Bulk import completed successfully');
    
    // Verify the import
    console.log('Verifying import...');
    const verified = await verifyImport(db);
    if (verified) {
      console.log('Import verification successful');
    } else {
      console.log('Import verification failed');
    }
    
  } catch (error) {
    console.error('Error during bulk import:', error);
  }
}

// Execute the bulk import
bulkImport().then(() => {
  console.log('Import process finished');
}).catch(error => {
  console.error('Import process failed:', error);
});
