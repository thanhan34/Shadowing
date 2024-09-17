import React from "react";
import parse from 'html-react-parser'

interface ParagraphProps {
  videoSource: string;
  sentence: string;
}

const Paragraph: React.FC<ParagraphProps> = ({ videoSource, sentence }) => {
  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono text-sm lg:flex">
      <div className="mt-5 d-flex flex-col h-100">
        <audio controls key={videoSource}>
          <source src={videoSource} type="audio/mpeg" />
        </audio>
        <p className="mt-5 mb-5 text-2xl text-center sm:text-left">{parse(sentence)}</p>
        <div className="flex flex-row pt-5 pb-5 space-x-5">
          <p className="p-3 border border-red-500 rounded-full ra-break">Pause</p>
          <p className="p-3 border border-orange-500 rounded-full ra-loss">Loss</p>
          <p className="p-3 border rounded-full border-cyan-400 ra-link">Linking</p>
          <p className="p-3 border border-gray-500 rounded-full ra-weak ">Weak</p>
        </div>
      </div>
    </div>
  );
};

export default Paragraph;