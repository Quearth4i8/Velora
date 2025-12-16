'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeConfig = {
    success: { bg: 'bg-green-900/20', border: 'border-green-700', icon: CheckCircle, color: 'text-green-400' },
    error: { bg: 'bg-red-900/20', border: 'border-red-700', icon: AlertCircle, color: 'text-red-400' },
    info: { bg: 'bg-blue-900/20', border: 'border-blue-700', icon: Info, color: 'text-blue-400' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-4 right-4 ${config.bg} border ${config.border} rounded-lg p-4 flex items-center gap-3 max-w-sm z-50`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <Icon className={`${config.color} flex-shrink-0`} size={20} />
          <p className="text-sm text-dark-200">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
