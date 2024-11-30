import React from 'react';

interface TimerProps {
  time: number;
}

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const Timer: React.FC<TimerProps> = ({ time }) => {
  return (
    <div className="text-gray-600">
      Time: {formatTime(time)}
    </div>
  );
};

export default Timer;
