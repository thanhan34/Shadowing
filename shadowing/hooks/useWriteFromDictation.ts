import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, getDocs, CollectionReference, query, where, Query, DocumentData } from "firebase/firestore";
import { parse } from "json2csv";
import { db } from "../firebase";
import { getNextImage } from "../utils/background";
import { AudioSample } from "../types/writefromdictation";
import { CustomAudioRef } from "../types";
import { buildAnswerTokensForDisplay, evaluateWriteFromDictation } from "../utils/writefromdictationScoring";

const resetScoreState = () => ({
  score: 0,
  maxScore: 0,
  wordStatuses: [] as Array<{ word: string; status: "correct" | "incorrect" | "missing" }>
});

export const useWriteFromDictation = () => {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  const audioRef = useRef<CustomAudioRef>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputText, setInputText] = useState("");
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [numberOfIncorrect, setNumberOfIncorrect] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Array<{ word: string; status: "correct" | "incorrect" | "missing" }>>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("Brian");
  const [sortingOption, setSortingOption] = useState<string>("occurrence");
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [alwaysShowAnswer, setAlwaysShowAnswer] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [filterOption, setFilterOption] = useState<string>("All");
  const [topicFilter, setTopicFilter] = useState<string>("All");

  useEffect(() => {
    setBackgroundImage(getNextImage());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const collectionRef: CollectionReference<DocumentData> = collection(db, "writefromdictation");
        const dataQuery: Query<DocumentData> = query(collectionRef, where("isHidden", "==", false));

        const querySnapshot = await getDocs(dataQuery);
        const data: AudioSample[] = querySnapshot.docs.map((doc) => doc.data() as AudioSample);

        setAudioSamples(data);
        setCurrentIndex(0);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAudioSamples = useMemo(() => {
    let filtered = audioSamples;

    switch (filterOption) {
      case "New":
        filtered = filtered.filter(sample => sample.questionType === "New");
        break;
      case "Still Important":
        filtered = filtered.filter(sample => sample.questionType === "Still Important");
        break;
      default:
        break;
    }

    if (topicFilter !== "All") {
      filtered = filtered.filter(sample => {
        const sampleTopic = sample.topic || "General";
        return sampleTopic === topicFilter;
      });
    }

    return filtered;
  }, [audioSamples, filterOption, topicFilter]);

  const sortedAudioSamples = useMemo(() => {
    return [...filteredAudioSamples].sort((a, b) => {
      switch (sortingOption) {
        case "alphabetical":
          return a.text.localeCompare(b.text);
        case "occurrence":
          return b.occurrence - a.occurrence;
        case "newest":
          return b.createdAt.seconds - a.createdAt.seconds;
        case "easyToDifficult":
          return a.text.length - b.text.length;
        default:
          return b.occurrence - a.occurrence;
      }
    });
  }, [filteredAudioSamples, sortingOption]);

  const currentAudioSample = sortedAudioSamples[currentIndex];

  const resetAnswerState = useCallback((resetInput: boolean) => {
    if (resetInput) {
      setInputText("");
    }

    const resetState = resetScoreState();
    setScore(resetState.score);
    setMaxScore(resetState.maxScore);
    setNumberOfIncorrect(resetState.numberOfIncorrect);
    setWordStatuses(resetState.wordStatuses);
  }, []);

  const handleNext = useCallback(async () => {
    if (sortedAudioSamples.length === 0) return;

    if (audioRef.current) {
      await audioRef.current.stop();
    }

    resetAnswerState(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sortedAudioSamples.length);
    setShowAnswer(alwaysShowAnswer);
  }, [sortedAudioSamples.length, alwaysShowAnswer, audioRef, resetAnswerState]);

  const handleBack = useCallback(async () => {
    if (sortedAudioSamples.length === 0) return;

    if (audioRef.current) {
      await audioRef.current.stop();
    }

    resetAnswerState(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? sortedAudioSamples.length - 1 : prevIndex - 1
    );
    setShowAnswer(alwaysShowAnswer);
  }, [sortedAudioSamples.length, alwaysShowAnswer, audioRef, resetAnswerState]);

  const handlePlayAll = useCallback(() => {
    setIsAutoplay((prev) => !prev);
    if (!isAutoplay) {
      handleNext();
    }
  }, [isAutoplay, handleNext]);

  const handleAudioEnd = useCallback(() => {
    if (isAutoplay) {
      setTimeout(() => {
        handleNext();
      }, 5000);
    } else if (isRepeatMode) {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  }, [isAutoplay, isRepeatMode, handleNext]);

  useEffect(() => {
    if (sortedAudioSamples.length > 0 && audioRef.current) {
      audioRef.current.play();
    }
  }, [sortedAudioSamples, currentIndex]);

  const handleSelectIndexChange = useCallback(async (newIndex: number) => {
    if (audioRef.current) {
      await audioRef.current.stop();
    }
    setCurrentIndex(newIndex);
    if (audioRef.current) {
      await audioRef.current.play();
    }
    setShowAnswer(alwaysShowAnswer);
    resetAnswerState(true);
  }, [audioRef, alwaysShowAnswer, resetAnswerState]);

  const handleAlwaysShowAnswerChange = useCallback((checked: boolean) => {
    setAlwaysShowAnswer(checked);
    setShowAnswer(checked);
  }, []);

  const handleInputTextChange = useCallback((value: string) => {
    setInputText(value);
  }, []);

  const handleVoiceChange = useCallback((voice: string) => {
    setSelectedVoice(voice);
  }, []);

  const handleSortingChange = useCallback((option: string) => {
    setSortingOption(option);
  }, []);

  const handleFilterChange = useCallback((option: string) => {
    setFilterOption(option);
  }, []);

  const handleTopicFilterChange = useCallback((topic: string) => {
    setTopicFilter(topic);
  }, []);

  const handlePlaybackRateChange = useCallback((newRate: number) => {
    setPlaybackRate(newRate);
  }, []);

  const countIncorrect = useCallback(() => {
    if (!currentAudioSample) return;

    const scoring = evaluateWriteFromDictation(currentAudioSample.text || "", inputText.trim());
    const answerTokens = buildAnswerTokensForDisplay(
      scoring.normalizedCorrectWords,
      scoring.normalizedInputWords
    );

    setScore(scoring.score);
    setMaxScore(scoring.maxScore);
    setNumberOfIncorrect(scoring.incorrectCount);
    setWordStatuses(answerTokens);
  }, [currentAudioSample, inputText]);

  const handleAnswerButtonClick = useCallback(() => {
    setShowAnswer(true);
    countIncorrect();
  }, [countIncorrect]);

  const handlePlay = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play();
    }
  }, []);

  const handleRepeat = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.stop();
      resetAnswerState(true);
      await audioRef.current.play();
    }
  }, [resetAnswerState]);

  const toggleRepeatMode = useCallback(() => {
    setIsRepeatMode(prev => !prev);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (sortedAudioSamples.length === 0) return;

    const fields = ["text", "occurrence", "questionType", "topic", "vietnameseTranslation"];
    const opts = { fields };

    try {
      const dataWithDefaults = sortedAudioSamples.map(sample => ({
        ...sample,
        topic: sample.topic || "General"
      }));
      const csv = parse(dataWithDefaults, opts);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "audio_samples.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting CSV:", err);
    }
  }, [sortedAudioSamples]);

  return {
    audioRef,
    backgroundImage,
    sortedAudioSamples,
    currentAudioSample,
    currentIndex,
    isAutoplay,
    isRepeatMode,
    showAnswer,
    alwaysShowAnswer,
    inputText,
    numberOfIncorrect,
    score,
    maxScore,
    wordStatuses,
    selectedVoice,
    sortingOption,
    playbackRate,
    loading,
    filterOption,
    topicFilter,
    handleNext,
    handleBack,
    handlePlayAll,
    handleAudioEnd,
    handleSelectIndexChange,
    handleAlwaysShowAnswerChange,
    handleInputTextChange,
    handleVoiceChange,
    handleSortingChange,
    handleFilterChange,
    handleTopicFilterChange,
    handlePlaybackRateChange,
    handleAnswerButtonClick,
    handlePlay,
    handleRepeat,
    toggleRepeatMode,
    handleExportCSV
  };
};