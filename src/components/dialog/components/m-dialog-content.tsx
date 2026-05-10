import React, { ReactNode } from "react";

interface MDialogContentProps {
  children: ReactNode;
}

const DialogContent: React.FC<MDialogContentProps> = ({ children }) => {
  return <div className="text-gray-700">{children}</div>;
};

export default DialogContent;
