import React from "react";

interface MDialogHeaderProps {
  title: string;
  onClose: () => void;
}

const MDialogHeader: React.FC<MDialogHeaderProps> = ({ title, onClose }) => {
  return (
    <div className="mb-4 flex items-center justify-between border-b pb-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

export default MDialogHeader;
