import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const Sentence = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
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
  const toggleEditSubSentence = (subSentenceId: string) => {
    setEditingSubSentenceId(subSentenceId);

    // Find the sub-sentence by ID and populate the new text for editing
    const subSentenceToEdit = subSentences.find(
      (subSentence) => subSentence.id === subSentenceId
    );
    if (subSentenceToEdit) {
      setNewSubSentenceText(subSentenceToEdit.text);
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
  const arrayOfObjects = [
    {
      text: "11 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/11%20Drug%20Overdose%20Deaths.mp3?alt=media&token=25de4a32-ae6a-417a-861c-4e947872a0c0",
    },
    {
      text: "12 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/12%20Drug%20Overdose%20Deaths.mp3?alt=media&token=6d8dfae9-794f-4f73-b2fa-1f7d6db182d5",
    },
    {
      text: "13 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/13%20Drug%20Overdose%20Deaths.mp3?alt=media&token=08031325-7a85-4fd7-9ea0-e72adc668178",
    },
    {
      text: "14 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/14%20Drug%20Overdose%20Deaths.mp3?alt=media&token=fb17717f-037a-4f9a-aa7d-2c5c46b64641",
    },
    {
      text: "15 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/15%20Drug%20Overdose%20Deaths.mp3?alt=media&token=ca536f2d-c91d-470f-93fb-c0a6b423be77",
    },
    {
      text: "16 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/16%20Drug%20Overdose%20Deaths.mp3?alt=media&token=91242fea-0880-4e57-82e8-af32372c4848",
    },
    {
      text: "17 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/17%20Drug%20Overdose%20Deaths.mp3?alt=media&token=8bfdc823-32c3-4995-a82f-b9daaafe73d3",
    },
    {
      text: "18 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/18%20Drug%20Overdose%20Deaths.mp3?alt=media&token=4c39696e-9b1e-4e85-8908-ee1017632be9",
    },
    {
      text: "19 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/19%20Drug%20Overdose%20Deaths.mp3?alt=media&token=52cdd5b5-df3b-4a57-8875-5ab22120b9d8",
    },
    {
      text: "20 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/20%20Drug%20Overdose%20Deaths.mp3?alt=media&token=f26f5093-185f-4550-b066-a40556c7de4a",
    },
    {
      text: "21 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/21%20Drug%20Overdose%20Deaths.mp3?alt=media&token=663eb5ae-dcd7-44ce-91e3-2046e6fc2ae9",
    },
    {
      text: "22 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/22%20Drug%20Overdose%20Deaths.mp3?alt=media&token=db9ae082-e2a8-4612-a303-34b0776a06db",
    },
    {
      text: "23 Drug Overdose Deaths.mp3",
      url: "https://firebasestorage.googleapis.com/v0/b/pteshadowing.appspot.com/o/23%20Drug%20Overdose%20Deaths.mp3?alt=media&token=158b047d-5065-4aae-9eec-9b1e1f46c416",
    },
  ];
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
  const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
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
      console.log("Sub-sentences loaded for the selected sentence, ordered by timestamp.");
    } catch (error) {
      console.error("Error fetching sub-sentences:", error);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (url !== "" && text !== "" && shadowingDocumentID !== "") {
        const docRef = collection(
          db,
          "shadowing",
          shadowingDocumentID,
          "sentence"
        );

        await addDoc(docRef, {
          url: url,
          text: text,
          timestamp: new Date().toISOString(), // Generate timestamp
        });
        setText("");
        setUrl("");
        console.log("Sentence added to subcollection in Firebase");
      } else {
        console.log(
          "Please fill in all fields and select a shadowing document"
        );
      }
    } catch (e) {
      console.error("Error adding sentence to subcollection in Firebase", e);
    }
  };
  const handleSubmitAll = async () => {
    for (const item of arrayOfObjects) {
      const { url, text } = item;

      try {
        if (url && text && shadowingDocumentID) {
          const docRef = collection(
            db,
            "shadowing",
            shadowingDocumentID,
            "sentence"
          );

          await addDoc(docRef, {
            url,
            text,
            timestamp: new Date().toISOString(),
          });

          console.log(
            `Sentence added to subcollection in Firebase: URL - ${url}, Text - ${text}`
          );
        } else {
          console.log(
            "Please fill in all fields and select a shadowing document"
          );
        }
      } catch (e) {
        console.error("Error adding sentence to subcollection in Firebase", e);
      }
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
                  <button onClick={() => saveEditSubSentence(subSentence.id)}>Save</button>
                </div>
              ) : (
                <div>
                  <p>{subSentence.text}</p>
                  <button onClick={() => toggleEditSubSentence(subSentence.id)}>Edit</button>
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
