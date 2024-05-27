export interface CustomAudioRef {
    play: () => Promise<void>;
    stop: () => Promise<void>;
  }
  