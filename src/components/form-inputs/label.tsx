import { Label as LabelArea } from "@/components/ui/label";
import React from "react";
type LabelProps = {
  htmlFor: string;

  required?: boolean;
  className?: string;
  children: React.ReactNode;
};
const Label = ({ htmlFor, children, required, className }: LabelProps) => {
  return (
    <LabelArea htmlFor={htmlFor} className={`${className}`}>
      {children}
      {required && <span className="text-red-500">*</span>}
    </LabelArea>
  );
};

export default Label;
