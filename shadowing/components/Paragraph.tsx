import React from "react";

interface ParagraphProps {
  videoSource: string;
  sentence: string;
}

const Paragraph: React.FC<ParagraphProps> = ({ videoSource, sentence }) => {
  return (
    <div className="z-10 items-center justify-between w-full max-w-5xl font-mono text-sm lg:flex">
      <div className="d-flex flex-column h-100">
        <video controls key={videoSource}>
          <source src={videoSource} type="audio/mpeg" />
        </video>
        <p className="mt-5 mb-5 text-2xl">{sentence}</p>
      </div>
    </div>
  );
};

export default Paragraph;
