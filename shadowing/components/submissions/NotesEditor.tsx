import React, { useState } from 'react';

interface NotesEditorProps {
  submissionId: string;
  initialNotes: string;
  isEditing: boolean;
  onSave: (submissionId: string, notes: string) => Promise<void>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

const NotesEditor: React.FC<NotesEditorProps> = ({
  submissionId,
  initialNotes,
  isEditing,
  onSave,
  onStartEdit,
  onCancelEdit,
}) => {
  const [tempNotes, setTempNotes] = useState(initialNotes);

  if (isEditing) {
    return (
      <div className="mt-4">
        <textarea
          value={tempNotes}
          onChange={(e) => setTempNotes(e.target.value)}
          className="w-full p-2 border rounded bg-[#232323] text-white"
          rows={4}
          placeholder="Enter notes here..."
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => onSave(submissionId, tempNotes)}
            className="px-3 sm:px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33] text-sm sm:text-base"
          >
            Save Notes
          </button>
          <button
            onClick={() => {
              onCancelEdit();
              setTempNotes(initialNotes);
            }}
            className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {initialNotes ? (
        <>
          <p className="text-[#FFFFFF] mb-2 break-words">{initialNotes}</p>
          <button
            onClick={onStartEdit}
            className="text-[#fc5d01] hover:text-[#fd7f33] text-sm sm:text-base"
          >
            Edit Notes
          </button>
        </>
      ) : (
        <button
          onClick={onStartEdit}
          className="text-[#fc5d01] hover:text-[#fd7f33] text-sm sm:text-base"
        >
          Add Notes
        </button>
      )}
    </div>
  );
};

export default NotesEditor;
