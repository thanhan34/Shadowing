import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

async function convertToWav(audioFile: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Read the file
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Decode the audio data
        const audioData = await audioContext.decodeAudioData(reader.result as ArrayBuffer);
        
        // Create a buffer with the audio data
        const numberOfChannels = 1; // Mono
        const sampleRate = 16000; // 16 kHz
        const buffer = audioContext.createBuffer(numberOfChannels, audioData.length, sampleRate);
        
        // Copy the audio data to the new buffer
        const channelData = audioData.getChannelData(0);
        buffer.copyToChannel(channelData, 0);
        
        // Create an offline context to render the audio
        const offlineContext = new OfflineAudioContext(numberOfChannels, audioData.length, sampleRate);
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineContext.destination);
        source.start();
        
        // Render the audio
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to WAV format
        const wavData = new Float32Array(renderedBuffer.length);
        renderedBuffer.copyFromChannel(wavData, 0);
        
        // Create WAV header
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        
        // WAV header format
        const writeString = (view: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };
        
        writeString(view, 0, 'RIFF'); // RIFF identifier
        view.setUint32(4, 36 + wavData.length * 2, true); // File length
        writeString(view, 8, 'WAVE'); // WAVE identifier
        writeString(view, 12, 'fmt '); // Format chunk identifier
        view.setUint32(16, 16, true); // Length of format chunk
        view.setUint16(20, 1, true); // Audio format (1 is PCM)
        view.setUint16(22, numberOfChannels, true); // Number of channels
        view.setUint32(24, sampleRate, true); // Sample rate
        view.setUint32(28, sampleRate * 2, true); // Byte rate
        view.setUint16(32, 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        writeString(view, 36, 'data'); // Data chunk identifier
        view.setUint32(40, wavData.length * 2, true); // Data chunk length
        
        // Combine header and data
        const wavBuffer = new ArrayBuffer(44 + wavData.length * 2);
        const wavView = new DataView(wavBuffer);
        
        // Copy header
        new Uint8Array(wavBuffer).set(new Uint8Array(wavHeader));
        
        // Copy audio data
        let offset = 44;
        for (let i = 0; i < wavData.length; i++) {
          const sample = Math.max(-1, Math.min(1, wavData[i]));
          const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          wavView.setInt16(offset, value, true);
          offset += 2;
        }
        
        resolve(wavBuffer);
      } catch (error) {
        reject(error);
      } finally {
        audioContext.close();
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(audioFile);
  });
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Converting audio to WAV format...');
      const wavData = await convertToWav(audioFile);
      
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || '',
        process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || ''
      );
      
      // Configure speech recognition
      speechConfig.speechRecognitionLanguage = 'en-US';
      speechConfig.enableDictation();
      
      // Create a push stream
      const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const pushStream = sdk.AudioInputStream.createPushStream(format);
      
      // Push the WAV data (excluding header)
      const audioData = new Uint8Array(wavData, 44); // Skip WAV header
      pushStream.write(audioData.buffer);
      pushStream.close();
      
      // Create audio config from the push stream
      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      
      // Create the speech recognizer
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      
      let transcription = '';

      // Handle recognition results
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          transcription += e.result.text + ' ';
          console.log('Recognized:', e.result.text);
        }
      };

      // Start recognition
      console.log('Starting recognition...');
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Recognition started successfully');
          // Stop after a reasonable time
          setTimeout(async () => {
            try {
              await recognizer.stopContinuousRecognitionAsync();
              resolve(transcription.trim());
            } catch (error) {
              reject(error);
            } finally {
              recognizer.close();
            }
          }, 5000);
        },
        error => {
          console.error('Error starting recognition:', error);
          recognizer.close();
          reject(error);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      reject(error);
    }
  });
}
