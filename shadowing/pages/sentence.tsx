import React, { useState, useEffect } from "react";
import { addDoc, collection, getDocs} from "firebase/firestore";
import { db } from "../firebase";
const Sentence = () => {
  
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");  
  const [arrayParagraph, setArrayParagraph] = useState<{ id: string; text:string, url:string, name:string}[]>([]);
  const [shadowingDocumentID, setShadowingDocumentID] = useState("")
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'shadowing'));
        const paragraphData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.get('text'),
          url: doc.get('url'),
          name: doc.get('name'),
        }))
        setArrayParagraph(paragraphData)
        if (paragraphData.length > 0) {
          setShadowingDocumentID(paragraphData[0].id);     
        }        
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };    
    fetchData();  
    return () => {
    };
  }, []);
    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // Get the selected option value (shadowing document ID)
        const selectedValue = event.target.value;
    
        // Update the selected shadowing document ID state
        setShadowingDocumentID(selectedValue);
        
      };
      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        try {
          if (url !== "" && text !== "" && shadowingDocumentID !== "") {
            const docRef = collection(db, "shadowing", shadowingDocumentID, "sentence");
      
            await addDoc(docRef, {
              url: url,
              text: text,
              timestamp: new Date().toISOString() // Generate timestamp
            });
      
            console.log("Sentence added to subcollection in Firebase");
          } else {
            console.log("Please fill in all fields and select a shadowing document");
          }
        } catch (e) {
          console.error("Error adding sentence to subcollection in Firebase", e);
        }
      };      
  return (
    <main
      className='flex flex-col items-center min-h-screen p-24'
    >
      <h1>Sentence</h1>
      <select className="mt-8 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" onChange={handleSelectChange} value={shadowingDocumentID}>
      {
        arrayParagraph.map((data) => (
          <option value={data.id} key={data.id}>
            {data.name}
            </option>
        ))
      }
      </select>
      {/* <p>Selected Shadowing Document ID: {shadowingDocumentID}</p> */}
      <form onSubmit={handleSubmit}> 
      <div className="mb-6">
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          URL:
          <input
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 w-full focus:border-blue-500 block  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        </div>
        <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Text:
          <textarea
            className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 w-full focus:border-blue-500 block  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter some text..."
          />
        </label>
          </div>       
       
       
        <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
      </form>
    </main>
  );
};

export default Sentence;
