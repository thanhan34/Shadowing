import React, { useState } from "react";
import Head from "next/head";

const Scraper: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    audioSrc: string | null;
    raBodyContent: string | null;
  } | null>(null);

  const handleScrape = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }

      setResult(data);

      if (!data.audioSrc && !data.raBodyContent) {
        setError("No audio or text content found on the page");
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to scrape the webpage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <Head>
        <title>Web Scraper - PTE Intensive</title>
        <meta name="description" content="Scrape audio and text content from web pages" />
      </Head>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#fc5d01' }}>
          Web Content Scraper
        </h1>

        <div className="bg-white border-2 rounded-lg p-6 shadow-lg" style={{ borderColor: '#fc5d01' }}>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Website URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to scrape (e.g., https://example.com)"
              disabled={isLoading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={isLoading}
            className="w-full text-white font-medium rounded-lg text-sm px-5 py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#fc5d01' }}
          >
            {isLoading ? 'Scraping...' : 'Scrape Content'}
          </button>

          {error && (
            <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold" style={{ color: '#fc5d01' }}>
                Scraping Results:
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Audio Source:</h3>
                {result.audioSrc ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Found audio URL:</p>
                    <div className="bg-white p-3 rounded border break-all text-sm">
                      {result.audioSrc}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No audio found</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">RA Body Content:</h3>
                {result.raBodyContent ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Found text content:</p>
                    <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto text-sm">
                      {result.raBodyContent}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No text content found</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            This tool extracts audio sources and text content from web pages.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Looking for: &lt;audio data-testid=&quot;audio&quot;&gt; and &lt;div class=&quot;ra-body&quot;&gt;
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scraper;
