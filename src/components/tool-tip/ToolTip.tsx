/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface FormFieldWithTooltipProps {
  label: any;
  tooltip: string;
}

const FormFieldWithTooltip = ({ label, tooltip }: FormFieldWithTooltipProps) => {
  return (
    <div className="relative flex items-center gap-2">
      <label className="font-medium text-gray-700">{label}</label>
      <div className="group relative">
        <HelpCircle 
          className="h-4 w-4 text-gray-400 hover:text-gray-500" 
        />
        <div className="invisible group-hover:visible text-center absolute z-10 w-64 px-4 py-2 mb-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -right-2 bottom-full transform -translate-x-1/2 left-1/2">
          <div className="absolute -bottom-1 left-1/2 right-3 w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2" />
          {tooltip}
        </div>
      </div>
    </div>
  );
};

export default FormFieldWithTooltip;