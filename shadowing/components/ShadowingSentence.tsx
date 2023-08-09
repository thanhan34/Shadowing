import React, { useState, useEffect } from "react";
import Paragraph from "./Paragraph";
import Sentence from "./Sentence";
import { collection, getDocs } from "firebase/firestore"; 
import {db} from '../firebase'



const ShadowingSentence: React.FC<{}> = () => {
    const [shadowingDocumentID, setShadowingDocumentID] = useState("")
    const [shadowingParagraphID, setShadowingParagraphID] = useState("")
    const [arraySen, setArraySen] = useState<{ id: string; text:string, url:string }[]>([]);   
    const [arrayParagraph, setArrayParagraph] = useState<{ id: string; text:string, url:string, name:string}[]>([]);    
    const [mode, setMode] = useState(true);
    const [count, setCount] = useState(0);
    const [videoSource, setVideoSource] = useState("");    
    const [sentence, setSentence] = useState("");
    const handleModeChange = () => {
      setMode(!mode);
      setCount(0)      
    };
  
    const handleNextClick = () => {     
      if (arraySen.length > 0 && count + 1 < arraySen.length) {
        setCount(count + 1);
      }
    };
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
              setSentence(paragraphData[0].text);
              setVideoSource(paragraphData[0].url);
            }
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };    
        fetchData();  
        return () => {
        };
      }, []);

     
      
      
      useEffect(() => {
        const fetchData = async () => {
          try {
            const shadowingRef = collection(db, 'shadowing');    
            const sentenceRef = collection(shadowingRef, shadowingDocumentID, 'sentence');
            const sentenceSnapshot = await getDocs(sentenceRef);    
            const data = sentenceSnapshot.docs.map((doc) => ({
              id: doc.id,
              text: doc.get('text'),
              url: doc.get('url'),
            }));            
           setArraySen(data)           
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };    
        fetchData();             
      }, [shadowingDocumentID]);

      
      const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // Get the selected option value (shadowing document ID)
        const selectedValue = event.target.value;
    
        // Update the selected shadowing document ID state
        setShadowingDocumentID(selectedValue);
        setMode(true)
      };
      
      useEffect(() => {
        const selectedParagraphData = arrayParagraph.find((data) => data.id === shadowingDocumentID);

        // Update the states with the text and video url from the matching object
        if (selectedParagraphData) {
          setSentence(selectedParagraphData.text);
          setVideoSource(selectedParagraphData.url);
        }
      }, [shadowingDocumentID])
      
  
  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono">
      <h1 className="pt-2 mb-1 text-2xl font-bold lg:mb-0 lg:mr-4">Shadowing</h1>
      
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
      
      {mode ? (
        <Paragraph videoSource={videoSource} sentence={sentence} />
      ) : (
        <Sentence videoSource={arraySen[count].url} sentence={arraySen[count].text} />
      )}

      {mode ? (
        <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700" onClick={handleModeChange}>1 Sentence Mode</button>
      ) : (
        <div className="flex flex-col mt-2 space-x-2 lg:flex-row">
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700" onClick={handleModeChange}>Paragraph</button>
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700" onClick={handleNextClick}>Back</button>
          <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700" onClick={handleNextClick}>Next</button>
        </div>
      )}
    </div>
  );
}

export default ShadowingSentence;
