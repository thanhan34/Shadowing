import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

interface AudioSample {
  audio: {
    Brian: string;
    Olivia: string;
    Joanna: string;
  };
  text: string;
  occurrence: number;
  createdAt?: Timestamp; // Make createdAt optional for the type
  isHidden?: boolean; // Make isHidden optional for the type
}

const AddAudioSample: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [message, setMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmitAll = async () => {
    try {
      const parsedArray: AudioSample[] = JSON.parse(inputText); // Parse the input text as JSON
      if (Array.isArray(parsedArray)) {
        const audioSamplesRef = collection(db, "writefromdictation");
        const existingSamplesSnapshot = await getDocs(audioSamplesRef);

        const existingSamples = existingSamplesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as AudioSample),
        }));

        const existingTexts = new Set(existingSamples.map((sample) => sample.text));
        const newTexts = new Set(parsedArray.map((sample) => sample.text));

        // Update or add new entries
        for (const item of parsedArray) {
          const { audio, text, occurrence } = item;

          // Ensure that audio, text, and occurrence are correctly defined and valid
          if (
            audio &&
            typeof audio === "object" &&
            typeof audio.Brian === "string" &&
            typeof audio.Olivia === "string" &&
            typeof audio.Joanna === "string" &&
            typeof text === "string" &&
            typeof occurrence === "number"
          ) {
            try {
              const q = query(audioSamplesRef, where("text", "==", text));
              const querySnapshot = await getDocs(q);

              const currentTime = Timestamp.now(); // Get current timestamp
              const isHidden = occurrence === 0; // Determine if the sample should be hidden

              if (!querySnapshot.empty) {
                // If the text already exists, update the occurrence, timestamp, and isHidden
                const existingDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, "writefromdictation", existingDoc.id), {
                  occurrence: occurrence,
                  createdAt: currentTime, // Update timestamp
                  isHidden: isHidden, // Update isHidden
                });
                setMessage((prev) => `${prev}\nAudio sample "${text}" occurrence updated.`);
              } else {
                // If the text doesn't exist, add a new document with timestamp and isHidden
                await addDoc(audioSamplesRef, {
                  audio,
                  text,
                  occurrence,
                  createdAt: currentTime, // Set timestamp
                  isHidden: isHidden, // Set isHidden
                });
                setMessage((prev) => `${prev}\nNew audio sample "${text}" added.`);
              }
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.error("Error adding/updating audio sample in Firestore", error);
                setMessage((prev) => `${prev}\nError adding/updating audio sample "${text}": ${error.message}`);
              } else {
                console.error("Unknown error", error);
              }
            }
          } else {
            setMessage((prev) => `${prev}\nInvalid item format: ${JSON.stringify(item)}`);
          }
        }

        // Set isHidden to true for all other existing samples not in the new batch
        for (const sample of existingSamples) {
          if (!newTexts.has(sample.text)) {
            await updateDoc(doc(db, "writefromdictation", sample.id), {
              isHidden: true,
            });
            setMessage((prev) => `${prev}\nAudio sample "${sample.text}" is now hidden.`);
          }
        }
      } else {
        setMessage("Invalid input. Please provide a valid JSON array.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error parsing input text:", error);
        setMessage(`Error parsing input text: ${error.message}`);
      } else {
        console.error("Unknown error:", error);
        setMessage("An unknown error occurred.");
      }
    }
  };

  return (
    <main className="flex mx-auto min-h-screen flex-col items-center min-w-screen p-24 space-y-5 w-full">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-600 dark:text-white">
        Add Audio Samples
      </h1>
      <textarea
        id="jsonInput"
        rows={10}
        className="w-full p-2 border border-gray-300 rounded text-black"
        placeholder="Paste your JSON here..."
        value={inputText}
        onChange={handleInputChange}
      ></textarea>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleSubmitAll}
      >
        Submit
      </button>
      {message && <p className="mt-4 text-black whitespace-pre-line">{message}</p>}
    </main>
  );
};

export default AddAudioSample;
