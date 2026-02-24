import React from "react";

interface AppShellBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const AppShellBackground: React.FC<AppShellBackgroundProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`relative min-h-screen ${className ?? ""}`}>
      <div className="app-shell-bg" aria-hidden="true" />
      <div className="app-shell-stars" aria-hidden="true" />
      <div className="app-shell-noise" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AppShellBackground;
