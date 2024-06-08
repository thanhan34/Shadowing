import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  deleteDoc,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";


const Sentence = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [inputText, setInputText] = useState("");
  const [arrayParagraph, setArrayParagraph] = useState<
    { id: string; text: string; url: string; name: string }[]
  >([]);
  const [shadowingDocumentID, setShadowingDocumentID] = useState("");
  const [editingSubSentenceId, setEditingSubSentenceId] = useState<
    string | null
  >(null);
  const [newSubSentenceText, setNewSubSentenceText] = useState<string>("");
  const [subSentences, setSubSentences] = useState<
    { id: string; text: string }[]
  >([]);
  const toggleEditSubSentence = async (subSentenceId: string) => {
    setEditingSubSentenceId(subSentenceId);

    // Find the sub-sentence by ID and populate the new text for editing
    const subSentenceToEdit = subSentences.find(
      (subSentence) => subSentence.id === subSentenceId
    );
    if (subSentenceToEdit) {
      try {
        // Read text from the clipboard
        const clipboardText = await navigator.clipboard.readText();

        // Update the state with the clipboard content
        setNewSubSentenceText(clipboardText);
      } catch (error) {
        console.error("Error reading clipboard content:", error);
      }
    }
  };
  const saveEditSubSentence = async (subSentenceId: string) => {
    try {
      if (newSubSentenceText.trim() !== "") {
        const sentenceDocRef = doc(
          db,
          "shadowing",
          shadowingDocumentID,
          "sentence",
          subSentenceId
        );

        await updateDoc(sentenceDocRef, {
          text: newSubSentenceText,
        });

        // Update the subSentences state with the modified sub-sentence
        setSubSentences((prevSubSentences) => {
          return prevSubSentences.map((subSentence) => {
            if (subSentence.id === subSentenceId) {
              return {
                ...subSentence,
                text: newSubSentenceText,
              };
            }
            return subSentence;
          });
        });

        // Reset editing state
        setEditingSubSentenceId(null);
        setNewSubSentenceText("");
        console.log("Sub-sentence updated in Firebase");
      } else {
        console.log("Please enter a valid text to update.");
      }
    } catch (error) {
      console.error("Error updating sub-sentence in Firebase:", error);
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "shadowing"), orderBy("name"))
        );
        const paragraphData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.get("text"),
          url: doc.get("url"),
          name: doc.get("name"),
        }));
        setArrayParagraph(paragraphData);
        if (paragraphData.length > 0) {
          setShadowingDocumentID(paragraphData[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    return () => {};
  }, []);
  const handleSelectChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValue = event.target.value;
    setShadowingDocumentID(selectedValue);

    try {
      // Fetch sub-sentences for the selected sentence ordered by timestamp
      const subSentenceCollectionRef = collection(
        db,
        "shadowing",
        selectedValue,
        "sentence"
      );

      const subSentenceQuerySnapshot = await getDocs(
        query(subSentenceCollectionRef, orderBy("timestamp"))
      );

      const subSentenceData = subSentenceQuerySnapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.get("text"),
      }));

      setSubSentences(subSentenceData);
      console.log(
        "Sub-sentences loaded for the selected sentence, ordered by timestamp."
      );
    } catch (error) {
      console.error("Error fetching sub-sentences:", error);
    }
  };  

  const handleSubmitAll = async () => {
    try {
      const parsedArray = JSON.parse(inputText); // Parse the input text as JSON
      if (Array.isArray(parsedArray)) {
        for (const item of parsedArray) {
          const { url, text } = item;

          try {
            if (url && text && shadowingDocumentID) {
              const docRef = collection(
                db,
                "shadowing",
                shadowingDocumentID,
                "sentence"
              );

              const newSentence = {
                url,
                text,
                timestamp: new Date().toISOString(),
              };

              // Add the new sentence to Firestore
              await addDoc(docRef, newSentence);

              // Update the subSentences state with the newly added sentence
              setSubSentences((prevSubSentences) => [
                ...prevSubSentences,
                {
                  id: "", // You should set the actual ID from Firestore if applicable
                  text,
                },
              ]);

              console.log(
                `Sentence added to subcollection in Firestore: URL - ${url}, Text - ${text}`
              );
            } else {
              console.log(
                "Please fill in all fields and select a shadowing document"
              );
            }
          } catch (e) {
            console.error(
              "Error adding sentence to subcollection in Firestore",
              e
            );
          }
        }
      } else {
        console.log("Invalid input. Please provide a valid JSON array.");
      }
    } catch (e) {
      console.error("Error parsing input text:", e);
    }
  };
  const deleteSubSentence = async (subSentenceId: string) => {
    try {
      // Reference to the sub-sentence document in Firestore
      const sentenceDocRef = doc(
        db,
        "shadowing",
        shadowingDocumentID,
        "sentence",
        subSentenceId
      );
  
      // Delete the sub-sentence document from Firestore
      await deleteDoc(sentenceDocRef);
  
      // Update the local state to remove the deleted sub-sentence
      setSubSentences((prevSubSentences) =>
        prevSubSentences.filter((subSentence) => subSentence.id !== subSentenceId)
      );
  
      console.log("Sub-sentence deleted from Firebase");
    } catch (error) {
      console.error("Error deleting sub-sentence from Firebase:", error);
    }
  };
  return (
    <main className="flex flex-col items-center min-h-screen p-24">
      <h1>Sentence</h1>
      <select
        className="mt-8 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        onChange={handleSelectChange}
        value={shadowingDocumentID}
      >
        {arrayParagraph.map((data) => (
          <option value={data.id} key={data.id}>
            {data.name}
          </option>
        ))}
      </select>
      <p>Selected Shadowing Document ID: {shadowingDocumentID}</p>
      <textarea
        placeholder="Paste or type your JSON array here"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={5}
        cols={40}
      />
      <button onClick={handleSubmitAll}>Submit</button>
      {/* Display sentences with edit and save options */}
      <div>
        <h2>Sentences:</h2>
        <div>
          <h2>Sub-Sentences:</h2>
          <ul>
            {subSentences.map((subSentence, index) => (
              <li key={subSentence.id}>
                {editingSubSentenceId === subSentence.id ? (
                  <div>
                    <input
                      type="text"
                      value={newSubSentenceText}
                      onChange={(e) => setNewSubSentenceText(e.target.value)}
                    />
                    <button onClick={() => saveEditSubSentence(subSentence.id)}>
                      Save
                    </button>
                    
                  </div>
                ) : (
                  <div className="flex pt-5 space-x-5">
                    <p>{subSentence.text}</p>
                    <button
                      onClick={() => toggleEditSubSentence(subSentence.id)}
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteSubSentence(subSentence.id)}>Delete</button> 
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
};

export default Sentence;
