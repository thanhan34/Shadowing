const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to read CSV and create a map
async function readCSV() {
  return new Promise((resolve, reject) => {
    const questionMap = new Map();
    const csvPath = path.join(__dirname, 'data', 'questions.csv');
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Normalize the content by trimming and converting to lowercase for comparison
        const content = row.Content.trim();
        const questionNo = row.QuestionNo.trim();
        questionMap.set(content, questionNo);
      })
      .on('end', () => {
        console.log(`CSV file successfully processed. Found ${questionMap.size} questions.`);
        resolve(questionMap);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Function to update Firestore documents
async function updateDocuments() {
  try {
    console.log('Reading CSV file...');
    const questionMap = await readCSV();
    
    console.log('Fetching documents from writefromdictation collection...');
    const collectionRef = db.collection('writefromdictation');
    const snapshot = await collectionRef.get();
    
    console.log(`Found ${snapshot.size} documents in writefromdictation collection.`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundTexts = [];
    
    // Process documents in batches
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const text = data.text ? data.text.trim() : '';
      
      // Try to find matching question in CSV
      if (questionMap.has(text)) {
        const questionNo = questionMap.get(text);
        batch.update(doc.ref, { ID: questionNo });
        updatedCount++;
        operationCount++;
        
        console.log(`✓ Matched: "${text.substring(0, 50)}..." -> ${questionNo}`);
        
        // Commit batch if we reach batch size
        if (operationCount >= batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} updates`);
          batch = db.batch();
          operationCount = 0;
        }
      } else {
        notFoundCount++;
        notFoundTexts.push(text.substring(0, 100));
        console.log(`✗ Not found in CSV: "${text.substring(0, 50)}..."`);
      }
    }
    
    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} updates`);
    }
    
    console.log('\n=== Update Summary ===');
    console.log(`Total documents processed: ${snapshot.size}`);
    console.log(`Documents updated with ID: ${updatedCount}`);
    console.log(`Documents not found in CSV: ${notFoundCount}`);
    
    if (notFoundTexts.length > 0) {
      console.log('\nFirst 10 texts not found in CSV:');
      notFoundTexts.slice(0, 10).forEach((text, index) => {
        console.log(`${index + 1}. ${text}...`);
      });
    }
    
    console.log('\n✅ Update process completed successfully!');
    
  } catch (error) {
    console.error('Error updating documents:', error);
    throw error;
  }
}

// Run the update
updateDocuments()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
