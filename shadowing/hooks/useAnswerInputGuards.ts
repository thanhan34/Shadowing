import { useCallback } from "react";
import type React from "react";

export const useAnswerInputGuards = () => {
  const handlePreventCopyPaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    return false;
  }, []);

  const handlePreventContextMenu = useCallback((event: React.MouseEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    return false;
  }, []);

  const handlePreventDragDrop = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    return false;
  }, []);

  return {
    handlePreventCopyPaste,
    handlePreventContextMenu,
    handlePreventDragDrop
  };
};