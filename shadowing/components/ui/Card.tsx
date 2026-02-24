import React from "react";
import { cn } from "../../lib/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  strong = false,
  hoverable = false,
}) => {
  return (
    <section
      className={cn(
        "ui-card",
        strong && "glass-strong",
        hoverable && "glass-hover",
        className
      )}
    >
      {children}
    </section>
  );
};

export default Card;
