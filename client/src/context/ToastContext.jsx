import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container: top-right on desktop, bottom-center on mobile */}
      <div className="fixed z-50 pointer-events-none flex flex-col gap-2 p-4 sm:top-4 sm:right-4 sm:bottom-auto bottom-16 left-0 right-0 sm:left-auto items-center sm:items-end">
        {toasts.map(toast => {
          let icon = <Info className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={1.5} />;
          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-4 h-4 text-gain shrink-0" strokeWidth={1.5} />;
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-loss shrink-0" strokeWidth={1.5} />;
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-btn bg-bg-card border border-border text-xs text-main shadow-card transition-all duration-150 animate-fadeIn max-w-sm"
            >
              {icon}
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted hover:text-main p-0.5 ml-1"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
