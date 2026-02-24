import React from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "tab";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  active = false,
  className,
  type = "button",
  ...props
}) => {
  const variantClass =
    variant === "primary"
      ? "ui-button-primary accent-glow"
      : variant === "secondary"
      ? "ui-button-secondary"
      : cn("ui-tab", active && "ui-tab-active accent-glow");

  return (
    <button
      type={type}
      className={cn("accent-ring", variantClass, className)}
      {...props}
    />
  );
};

export default Button;
