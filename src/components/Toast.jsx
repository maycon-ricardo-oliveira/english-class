'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Toast({ message, type, onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) {
    return null;
  }

  const baseClasses = "fixed top-5 right-5 p-4 rounded-md shadow-lg flex items-center space-x-3 z-[100]";
  let typeClasses = "";
  let IconComponent = null;

  switch (type) {
    case 'success':
      typeClasses = "bg-green-500 text-white";
      IconComponent = <CheckCircle className="h-5 w-5" />;
      break;
    case 'error':
      typeClasses = "bg-red-500 text-white";
      IconComponent = <AlertTriangle className="h-5 w-5" />;
      break;
    default: // 'info' or other types can be added
      typeClasses = "bg-blue-500 text-white";
      IconComponent = <AlertTriangle className="h-5 w-5" />; // Default icon
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {IconComponent}
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
