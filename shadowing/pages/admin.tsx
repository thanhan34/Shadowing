import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
const Admin = () => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [practice, setPractice] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      setScrapeError("Please enter a URL to scrape");
      return;
    }

    setIsLoading(true);
    setScrapeError("");

    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(scrapeUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }

      // Auto-fill the form fields
      if (data.audioSrc) {
        setUrl(data.audioSrc);
      }
      if (data.raBodyContent) {
        setText(data.raBodyContent);
      }

      // Show success message or handle case where no data was found
      if (!data.audioSrc && !data.raBodyContent) {
        setScrapeError("No audio or text content found on the page");
      } else if (!data.audioSrc) {
        setScrapeError("Audio not found, but text content was extracted");
      } else if (!data.raBodyContent) {
        setScrapeError("Text content not found, but audio was extracted");
      }

    } catch (error) {
      setScrapeError(error instanceof Error ? error.message : 'Failed to scrape the webpage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (name !== "" && url !== "" && text !== "") {
        await addDoc(collection(db, "shadowing"), {
          name: name,
          url: url,
          text: text,
          practice: practice,
        });
        setName("")
        setText("")
        setUrl("")
        setPractice("")
        console.log("Document written to Firebase");
      } else {
        console.log("Please fill in all fields");
      }
    } catch (e) {
      console.error("Error adding to Firebase", e);
    }
  };

  return (
    <main
      className='flex flex-col items-center justify-between min-h-screen p-24'
    >
      {/* Scraping Section */}
      <div className="mb-8 p-6 border-2 border-orange-500 rounded-lg bg-orange-50 dark:bg-gray-800 dark:border-orange-400">
        <h2 className="text-xl font-bold mb-4 text-orange-600 dark:text-orange-400">Auto Scrape Content</h2>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Website URL to Scrape:
            <input
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 w-full focus:border-orange-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-orange-500 dark:focus:border-orange-500"
              type="text"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="Enter URL to scrape (e.g., https://example.com)"
              disabled={isLoading}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleScrape}
          disabled={isLoading}
          className="text-white bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Scraping...' : 'Scrape Content'}
        </button>
        {scrapeError && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
            {scrapeError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="min-w-sm">
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Name:
            <input
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 w-full focus:border-blue-500 block  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
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
              rows={5}
              cols={500}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter some text..."
            />
          </label>
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Practice Link:
            <input
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 w-full focus:border-blue-500 block  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
              type="text"
              value={practice}
              onChange={(e) => setPractice(e.target.value)}
            />
          </label>
        </div>
        <br />
        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Submit
        </button>
      </form>
    </main>
  );
};

export default Admin;
