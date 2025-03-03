import React, { useState, useEffect } from 'react';

interface TemplateField {
  id: string;
  placeholder: string;
  value: string;
}

interface DescribeImageTemplateProps {
  type: 'picture' | 'line_chart' | 'bar_chart' | 'pie_chart';
}

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

const DescribeImageTemplate: React.FC<DescribeImageTemplateProps> = ({ type }) => {
  const [fields, setFields] = useState<TemplateField[]>([
    { id: 'topic', placeholder: 'Topic', value: '' },
    { id: 'elements', placeholder: 'number of elements', value: '' },
    { id: 'maxElement', placeholder: 'A (maximum element)', value: '' },
    { id: 'maxValue', placeholder: 'maximum value (e.g., 75 percent)', value: '' },
    { id: 'minElement', placeholder: 'B (minimum element)', value: '' },
    { id: 'minValue', placeholder: 'minimum value (e.g., 25 percent)', value: '' },
    { id: 'keywords', placeholder: 'keywords', value: '' },
  ]);

  const [completedText, setCompletedText] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [isSentenceMode, setIsSentenceMode] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=RESPONSIVE_VOICE_KEY';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
      document.body.removeChild(script);
    };
  }, []);

  const handleFieldChange = (id: string, value: string) => {
    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, value } : field
    );
    setFields(updatedFields);
    updateCompletedText(updatedFields);
  };

  const getTemplateText = (type: string) => {
    switch (type) {
      case 'picture':
        return { prefix: 'picture', mediaType: 'image' };
      case 'line_chart':
        return { prefix: 'line chart', mediaType: 'chart' };
      case 'bar_chart':
        return { prefix: 'bar chart', mediaType: 'chart' };
      case 'pie_chart':
        return { prefix: 'pie chart', mediaType: 'chart' };
      default:
        return { prefix: 'picture', mediaType: 'image' };
    }
  };

  const updateCompletedText = (updatedFields: TemplateField[]) => {
    const fieldValues = updatedFields.reduce((acc, field) => {
      acc[field.id] = field.value || `[${field.placeholder}]`;
      return acc;
    }, {} as Record<string, string>);

    const { prefix, mediaType } = getTemplateText(type);

    const text = `This is a ${prefix}, and the ${prefix} show the information about ${fieldValues.topic}.

The given ${prefix} contains ${fieldValues.elements} main elements.

As can be seen from the ${mediaType}, ${fieldValues.maxElement} has the maximum number, which is ${fieldValues.maxValue} percent.

On the other hand, ${fieldValues.minElement} has the minimum number, which is ${fieldValues.minValue} percent.

Overall, these elements are distributed clearly, highlighting differences between segments.

There are no major changes over time.

In conclusion, the ${prefix} also gives the information about ${fieldValues.keywords}.`;

    setCompletedText(text);
  };

  const sentences = completedText.split('\n\n').filter(s => s.trim());

  const speakText = (text: string) => {
    if (window.responsiveVoice) {
      if (isPlaying) {
        window.responsiveVoice.cancel();
        setIsPlaying(false);
      } else {
        window.responsiveVoice.speak(text, 'UK English Female', {
          pitch: 1,
          rate: 0.9,
          volume: 1,
          onend: () => setIsPlaying(false),
        });
        setIsPlaying(true);
      }
    }
  };

  const togglePlayback = () => {
    const textToSpeak = isSentenceMode ? 
      sentences[currentSentenceIndex] : 
      completedText;
    speakText(textToSpeak);
  };

  const toggleMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      updateCompletedText(fields);
    }
  };

  const toggleSentenceMode = () => {
    if (window.responsiveVoice) {
      window.responsiveVoice.cancel();
    }
    setIsPlaying(false);
    setIsSentenceMode(!isSentenceMode);
    setCurrentSentenceIndex(0);
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
      setIsPlaying(false);
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
      setIsPlaying(false);
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 flex space-x-4">
        <button
          onClick={toggleMode}
          className="px-4 py-2 rounded-lg transition-all duration-300 font-medium"
          style={{
            backgroundColor: isEditing ? '#fc5d01' : '#fedac2',
            color: isEditing ? '#ffffff' : '#fc5d01',
          }}
        >
          {isEditing ? 'View Complete Text' : 'Edit Fields'}
        </button>
        {!isEditing && (
          <button
            onClick={toggleSentenceMode}
            className="px-4 py-2 rounded-lg transition-all duration-300 font-medium"
            style={{
              backgroundColor: isSentenceMode ? '#fc5d01' : '#fedac2',
              color: isSentenceMode ? '#ffffff' : '#fc5d01',
            }}
          >
            {isSentenceMode ? 'View Full Text' : 'Practice Sentences'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col">
              <label
                htmlFor={field.id}
                className="mb-1 font-medium text-lg"
                style={{ color: '#fc5d01' }}
              >
                {field.placeholder}:
              </label>
              <input
                type="text"
                id={field.id}
                value={field.value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 text-lg"
                style={{
                  borderColor: '#fc5d01',
                  backgroundColor: '#ffffff',
                  color: '#fc5d01',
                }}
                placeholder={`Enter ${field.placeholder.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-full flex justify-center">
            <button
              onClick={togglePlayback}
              className="px-6 py-3 rounded-lg transition-all duration-300 font-medium text-lg flex items-center space-x-2"
              style={{
                backgroundColor: isPlaying ? '#fedac2' : '#fc5d01',
                color: isPlaying ? '#fc5d01' : '#ffffff',
              }}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
          </div>

          <div 
            className="p-8 rounded-lg whitespace-pre-wrap text-lg font-medium"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #fc5d01',
              color: '#fc5d01',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              lineHeight: '2'
            }}
          >
            {isSentenceMode ? (
              <>
                <p className="mb-4">{sentences[currentSentenceIndex]}</p>
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={handlePrevSentence}
                    disabled={currentSentenceIndex === 0}
                    className="px-4 py-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: currentSentenceIndex === 0 ? '#fedac2' : '#fc5d01',
                      color: currentSentenceIndex === 0 ? '#fc5d01' : '#ffffff',
                      opacity: currentSentenceIndex === 0 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <span className="font-medium" style={{ color: '#fc5d01' }}>
                    {currentSentenceIndex + 1} / {sentences.length}
                  </span>
                  <button
                    onClick={handleNextSentence}
                    disabled={currentSentenceIndex === sentences.length - 1}
                    className="px-4 py-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: currentSentenceIndex === sentences.length - 1 ? '#fedac2' : '#fc5d01',
                      color: currentSentenceIndex === sentences.length - 1 ? '#fc5d01' : '#ffffff',
                      opacity: currentSentenceIndex === sentences.length - 1 ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              completedText
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DescribeImageTemplate;
