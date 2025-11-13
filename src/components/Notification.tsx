import React, { useEffect, useState } from 'react';
import type { NotificationData } from '../types';

interface NotificationProps {
  notification: NotificationData | null;
  onClose: () => void;
}

const notificationConfig = {
  success: {
    icon: 'fa-check-circle',
    title: 'Başarılı!',
    barClass: 'bg-success-400',
    textClass: 'text-success-900',
    bgClass: 'bg-success-50',
    borderClass: 'border-success-400',
  },
  error: {
    icon: 'fa-times-circle',
    title: 'Hata!',
    barClass: 'bg-danger-400',
    textClass: 'text-danger-900',
    bgClass: 'bg-danger-50',
    borderClass: 'border-danger-400',
  },
};

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, 5000); // Auto-close after 5 seconds

      const exitTimer = setTimeout(() => {
        onClose();
      }, 5500); // Allow exit animation to complete

      return () => {
        clearTimeout(timer);
        clearTimeout(exitTimer);
      };
    }
  }, [notification, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!notification) {
    return null;
  }

  const config = notificationConfig[notification.type];
  const animationClass = isExiting ? 'animate-fade-out-to-right' : 'animate-slide-in-from-right';

  return (
    <div className={`fixed top-24 right-8 z-50 w-full max-w-sm ${animationClass}`}>
      <div className={`relative rounded-lg shadow-lg border-l-4 overflow-hidden ${config.bgClass} ${config.borderClass}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className={`fas ${config.icon} text-xl ${config.textClass}`}></i>
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className={`text-sm font-bold ${config.textClass}`}>{config.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{notification.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className={`inline-flex rounded-md p-1 text-text-secondary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary-500`}
              >
                <span className="sr-only">Kapat</span>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 ${config.barClass} animate-progress-bar`}></div>
      </div>
    </div>
  );
};
