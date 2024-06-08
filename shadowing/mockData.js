import { Timestamp } from "firebase/firestore";

export const mockAudioSamples = [
  {
    audio: { Brian: "url/to/audio1_brian.mp3", Amy: "url/to/audio1_amy.mp3" },
    text: "This is the first audio sample.",
    occurrence: 10,
    createdAt: new Timestamp(1653590400, 0), // Example timestamp
    isHidden: false,
  },
  {
    audio: { Brian: "url/to/audio2_brian.mp3", Amy: "url/to/audio2_amy.mp3" },
    text: "Here is the second audio sample.",
    occurrence: 5,
    createdAt: new Timestamp(1653676800, 0), // Example timestamp
    isHidden: false,
  },
  {
    audio: { Brian: "url/to/audio3_brian.mp3", Amy: "url/to/audio3_amy.mp3" },
    text: "And this is the third audio sample.",
    occurrence: 8,
    createdAt: new Timestamp(1653763200, 0), // Example timestamp
    isHidden: false,
  },
];
