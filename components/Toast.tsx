import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const colors = {
    success: 'border-green-500 text-green-400 bg-green-900/90 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    info: 'border-arrow-400 text-arrow-400 bg-arrow-900/90 shadow-[0_0_15px_rgba(57,193,243,0.3)]',
    error: 'border-red-500 text-red-400 bg-red-900/90 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-2xl border ${colors[toast.type]} flex items-center gap-3 animate-in slide-in-from-right duration-300 font-mono text-xs backdrop-blur-md max-w-sm`}>
       <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'info' ? 'bg-arrow-400' : 'bg-red-500'} animate-pulse`} />
       <div className="flex-1">{toast.message}</div>
    </div>
  );
};

export default Toast;