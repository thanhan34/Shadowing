import React from "react";
import { cn } from "../../lib/cn";

type InputElementProps = React.InputHTMLAttributes<HTMLInputElement>;
type TextAreaElementProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

interface InputProps extends InputElementProps {
  multiline?: false;
}

interface TextAreaProps extends TextAreaElementProps {
  multiline: true;
}

type UnifiedInputProps = InputProps | TextAreaProps;

const Input: React.FC<UnifiedInputProps> = (props) => {
  if (props.multiline) {
    const { multiline, className, rows = 4, ...rest } = props;
    return <textarea rows={rows} className={cn("ui-input", className)} {...rest} />;
  }

  const { multiline, className, ...rest } = props;
  return <input className={cn("ui-input", className)} {...rest} />;
};

export default Input;
