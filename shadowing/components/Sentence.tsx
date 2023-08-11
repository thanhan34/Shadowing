import React from "react";

interface SentenceProps {
  videoSource: string;
  sentence: string;
}

const Sentence: React.FC<SentenceProps> = ({ videoSource, sentence }) => {
  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono text-sm lg:flex">
      <div className="mt-5 d-flex flex-column h-100">
        <audio controls autoPlay loop key={videoSource}>
          <source src={videoSource} type="audio/mpeg" />
        </audio>
        <p className="mt-5 mb-5 text-2xl">{sentence}</p>
      </div>
    </div>
  );
};

export default Sentence;
