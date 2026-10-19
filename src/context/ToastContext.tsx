import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  handleApiError: (err: any, fallbackMessage?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, description }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((message: string, description?: string) => {
    addToast(message, 'success', description);
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    addToast(message, 'error', description);
  }, [addToast]);

  const warning = useCallback((message: string, description?: string) => {
    addToast(message, 'warning', description);
  }, [addToast]);

  const info = useCallback((message: string, description?: string) => {
    addToast(message, 'info', description);
  }, [addToast]);

  const handleApiError = useCallback((err: any, fallbackMessage: string = 'Operation failed') => {
    console.error('API Error:', err);
    let msg = fallbackMessage;
    let desc = '';

    if (typeof err === 'string') {
      desc = err;
    } else if (err?.message) {
      desc = err.message;
      // Handle Postgres / RLS error messages friendly
      if (err.message.includes('row-level security') || err.message.includes('violates row-level security policy')) {
        msg = 'Access Denied';
        desc = 'You do not have permission to perform this action under current role policies.';
      } else if (err.message.includes('duplicate key')) {
        msg = 'Duplicate Record';
        desc = 'A record with this identifier or unique value already exists.';
      } else if (err.message.includes('Payment amount must be greater than zero')) {
        msg = 'Invalid Amount';
        desc = 'Payment amount must be greater than zero.';
      }
    }

    addToast(msg, 'error', desc);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info, handleApiError }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
            error: <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />,
          };

          const borders = {
            success: 'border-emerald-500/30 bg-slate-900/95 shadow-emerald-950/40',
            error: 'border-rose-500/30 bg-slate-900/95 shadow-rose-950/40',
            warning: 'border-amber-500/30 bg-slate-900/95 shadow-amber-950/40',
            info: 'border-cyan-500/30 bg-slate-900/95 shadow-cyan-950/40',
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borders[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100">{toast.message}</p>
                {toast.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-3">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
