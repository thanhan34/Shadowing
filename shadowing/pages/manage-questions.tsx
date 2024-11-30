import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

type QuestionType = 'readAloud' | 'rwfib' | 'rfib' | 'wfd';
type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

interface Question {
  type: QuestionType;
  content: string;
  answer?: string;
  options?: string[][] | Record<string, string[]>;
  correctAnswers?: string[];
  difficulty?: DifficultyLevel;
  taskNumber?: string;
}

interface RWFIBQuestion {
  type: 'rwfib';
  content: string;
  options: Record<string, string[]>;
  correctAnswers: Record<string, string>;
}

interface RFIBQuestion {
  type: 'rfib';
  content: string;
  options: string[];
  correctAnswers: string[];
  difficulty: DifficultyLevel;
  taskNumber: string;
}

export default function ManageQuestions() {
  const [questionType, setQuestionType] = useState<QuestionType>('readAloud');
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [blankCount, setBlankCount] = useState(0);
  const [optionsForBlanks, setOptionsForBlanks] = useState<string[][]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Easy');
  const [taskNumber, setTaskNumber] = useState('');
  const [rfibOptions, setRfibOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (questionType === 'rwfib') {
      const matches = (content.match(/_____/g) || []).length;
      if (matches !== blankCount) {
        setBlankCount(matches);
        const newOptions = Array(matches).fill(null).map(() => Array(4).fill(''));
        setOptionsForBlanks(newOptions);
        setCorrectAnswers(Array(matches).fill(''));
      }
    } else if (questionType === 'rfib') {
      const matches = (content.match(/_____/g) || []).length;
      if (matches !== blankCount) {
        setBlankCount(matches);
        setCorrectAnswers(Array(matches).fill(''));
      }
    }
  }, [content, questionType, blankCount]);

  const handleOptionChange = (blankIndex: number, optionIndex: number, value: string) => {
    const newOptions = [...optionsForBlanks];
    if (!newOptions[blankIndex]) {
      newOptions[blankIndex] = Array(4).fill('');
    }
    newOptions[blankIndex][optionIndex] = value;
    setOptionsForBlanks(newOptions);
  };

  const handleCorrectAnswerChange = (blankIndex: number, value: string) => {
    const newCorrectAnswers = [...correctAnswers];
    newCorrectAnswers[blankIndex] = value;
    setCorrectAnswers(newCorrectAnswers);
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setRfibOptions([...rfibOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setRfibOptions(rfibOptions.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setContent('');
    setAnswer('');
    setOptionsForBlanks([]);
    setCorrectAnswers([]);
    setBlankCount(0);
    setSuccessMessage('');
    setErrorMessage('');
    setDifficulty('Easy');
    setTaskNumber('');
    setRfibOptions([]);
    setNewOption('');
  };

  const validateRWFIB = () => {
    try {
      if (blankCount === 0) {
        setErrorMessage('Please add blanks using _____');
        return false;
      }

      for (let i = 0; i < blankCount; i++) {
        if (!optionsForBlanks[i] || optionsForBlanks[i].length !== 4) {
          setErrorMessage(`Please provide 4 options for blank ${i + 1}`);
          return false;
        }

        const emptyOptions = optionsForBlanks[i].filter(opt => !opt.trim()).length;
        if (emptyOptions > 0) {
          setErrorMessage(`Please fill in all options for blank ${i + 1}`);
          return false;
        }

        if (!correctAnswers[i]) {
          setErrorMessage(`Please select a correct answer for blank ${i + 1}`);
          return false;
        }

        if (!optionsForBlanks[i].includes(correctAnswers[i])) {
          setErrorMessage(`Correct answer for blank ${i + 1} must be one of the options`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in validateRWFIB:', error);
      setErrorMessage(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const validateRFIB = () => {
    try {
      if (blankCount === 0) {
        setErrorMessage('Please add blanks using _____');
        return false;
      }

      if (!taskNumber) {
        setErrorMessage('Please enter a task number');
        return false;
      }

      if (rfibOptions.length < blankCount * 2) {
        setErrorMessage(`Please provide at least ${blankCount * 2} options for the blanks`);
        return false;
      }

      if (correctAnswers.length !== blankCount) {
        setErrorMessage('Please select correct answers for all blanks');
        return false;
      }

      for (const answer of correctAnswers) {
        if (!rfibOptions.includes(answer)) {
          setErrorMessage('All correct answers must be from the options list');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in validateRFIB:', error);
      setErrorMessage(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      if (questionType === 'rwfib') {
        if (!validateRWFIB()) {
          return;
        }

        const rwfibQuestion: RWFIBQuestion = {
          type: 'rwfib',
          content,
          options: optionsForBlanks.reduce((acc, options, index) => {
            acc[index.toString()] = options;
            return acc;
          }, {} as Record<string, string[]>),
          correctAnswers: correctAnswers.reduce((acc, answer, index) => {
            acc[index.toString()] = answer;
            return acc;
          }, {} as Record<string, string>)
        };

        await addDoc(collection(db, 'questions'), rwfibQuestion);
        setSuccessMessage('Question added successfully!');
        resetForm();
      } else if (questionType === 'rfib') {
        if (!validateRFIB()) {
          return;
        }

        const rfibQuestion: RFIBQuestion = {
          type: 'rfib',
          content,
          options: rfibOptions,
          correctAnswers,
          difficulty,
          taskNumber
        };

        await addDoc(collection(db, 'questions'), rfibQuestion);
        setSuccessMessage('Question added successfully!');
        resetForm();
      } else {
        const questionData: Question = {
          type: questionType,
          content,
        };

        if (questionType === 'wfd') {
          questionData.answer = answer;
        }

        await addDoc(collection(db, 'questions'), questionData);
        setSuccessMessage('Question added successfully!');
        resetForm();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setErrorMessage(`Error adding question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-8">Manage Test Questions</h1>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-900 text-green-200 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-900 text-red-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => {
                  setQuestionType(e.target.value as QuestionType);
                  resetForm();
                }}
                className="w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="readAloud">Read Aloud</option>
                <option value="rwfib">Reading & Writing Fill in the Blanks</option>
                <option value="rfib">Reading Fill in the Blanks</option>
                <option value="wfd">Write From Dictation</option>
              </select>
            </div>

            {questionType === 'rfib' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Number
                  </label>
                  <input
                    type="text"
                    value={taskNumber}
                    onChange={(e) => setTaskNumber(e.target.value)}
                    className="w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 1088"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {questionType === 'wfd' ? 'Audio File URL' : 'Question Content'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={
                  questionType === 'rwfib' || questionType === 'rfib'
                    ? 'Enter question content with _____ for blanks'
                    : questionType === 'wfd'
                    ? 'Enter audio file URL'
                    : 'Enter question content'
                }
                required
              />
              {(questionType === 'rwfib' || questionType === 'rfib') && (
                <p className="mt-2 text-sm text-gray-400">
                  Use _____ (5 underscores) to mark each blank in the text
                </p>
              )}
            </div>

            {questionType === 'wfd' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {questionType === 'rwfib' && blankCount > 0 && (
              <div className="space-y-6">
                <div className="text-sm font-medium text-gray-300 mb-4">
                  Enter 4 options for each blank. The correct answer must be one of these options.
                </div>
                {Array.from({ length: blankCount }).map((_, blankIndex) => (
                  <div key={blankIndex} className="space-y-4 bg-gray-700 p-4 rounded-lg">
                    <div className="text-white font-medium">Blank {blankIndex + 1}</div>
                    <div className="grid grid-cols-2 gap-4">
                      {[0, 1, 2, 3].map((optionIndex) => (
                        <div key={optionIndex}>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Option {optionIndex + 1}
                          </label>
                          <input
                            type="text"
                            value={optionsForBlanks[blankIndex]?.[optionIndex] || ''}
                            onChange={(e) => handleOptionChange(blankIndex, optionIndex, e.target.value)}
                            className="w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Correct Answer
                      </label>
                      <select
                        value={correctAnswers[blankIndex] || ''}
                        onChange={(e) => handleCorrectAnswerChange(blankIndex, e.target.value)}
                        className="w-full rounded-md bg-gray-600 border-gray-500 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select correct answer</option>
                        {optionsForBlanks[blankIndex]?.map((option, index) => (
                          option && (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          )
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {questionType === 'rfib' && blankCount > 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add Options for Drag and Drop
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      className="flex-1 rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter an option"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Options List ({rfibOptions.length})
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-700 rounded-lg">
                    {rfibOptions.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 px-3 py-1 bg-gray-600 rounded-md"
                      >
                        <span className="text-white">{option}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-300 mb-4">
                    Select correct answers for each blank
                  </div>
                  {Array.from({ length: blankCount }).map((_, blankIndex) => (
                    <div key={blankIndex} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Correct Answer for Blank {blankIndex + 1}
                      </label>
                      <select
                        value={correctAnswers[blankIndex] || ''}
                        onChange={(e) => handleCorrectAnswerChange(blankIndex, e.target.value)}
                        className="w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select correct answer</option>
                        {rfibOptions.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Question
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
