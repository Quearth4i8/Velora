'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';

type AlertInput =
  | string
  | {
    title?: string;
    message: string;
    confirmText?: string;
  };

type ConfirmInput =
  | string
  | {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  };

type DialogRequest =
  | {
    type: 'alert';
    title: string;
    message: string;
    confirmText: string;
    resolve: () => void;
  }
  | {
    type: 'confirm';
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    destructive: boolean;
    resolve: (value: boolean) => void;
  };

interface DialogApi {
  alert: (input: AlertInput) => Promise<void>;
  confirm: (input: ConfirmInput) => Promise<boolean>;
}

const DialogContext = React.createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState<DialogRequest | null>(null);
  const queueRef = React.useRef<DialogRequest[]>([]);

  const processNext = React.useCallback(() => {
    if (active) return;
    const next = queueRef.current.shift();
    if (next) setActive(next);
  }, [active]);

  React.useEffect(() => {
    processNext();
  }, [processNext]);

  const enqueue = React.useCallback(
    (req: DialogRequest) => {
      if (active) {
        queueRef.current.push(req);
      } else {
        setActive(req);
      }
    },
    [active]
  );

  const closeActive = React.useCallback(() => {
    setActive(null);
    setTimeout(() => {
      const next = queueRef.current.shift();
      if (next) setActive(next);
    }, 0);
  }, []);

  const api = React.useMemo<DialogApi>(() => {
    return {
      alert: (input) => {
        const opts = typeof input === 'string' ? { message: input } : input;
        return new Promise<void>((resolve) => {
          enqueue({
            type: 'alert',
            title: opts.title ?? 'Notice',
            message: opts.message,
            confirmText: opts.confirmText ?? 'OK',
            resolve,
          });
        });
      },
      confirm: (input) => {
        const opts = typeof input === 'string' ? { message: input } : input;
        return new Promise<boolean>((resolve) => {
          enqueue({
            type: 'confirm',
            title: opts.title ?? 'Confirm',
            message: opts.message,
            confirmText: opts.confirmText ?? 'Confirm',
            cancelText: opts.cancelText ?? 'Cancel',
            destructive: opts.destructive ?? false,
            resolve,
          });
        });
      },
    };
  }, [enqueue]);

  const handleClose = React.useCallback(() => {
    if (!active) return;
    if (active.type === 'confirm') {
      active.resolve(false);
    } else {
      active.resolve();
    }
    closeActive();
  }, [active, closeActive]);

  const handleConfirm = React.useCallback(() => {
    if (!active) return;
    if (active.type === 'confirm') {
      active.resolve(true);
    } else {
      active.resolve();
    }
    closeActive();
  }, [active, closeActive]);

  const handleCancel = React.useCallback(() => {
    if (!active) return;
    if (active.type === 'confirm') {
      active.resolve(false);
      closeActive();
      return;
    }
    active.resolve();
    closeActive();
  }, [active, closeActive]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        isOpen={!!active}
        onClose={handleClose}
        title={active?.title ?? ''}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">{active?.message}</p>
          <div className="flex justify-end gap-3">
            {active?.type === 'confirm' && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-dark-700/50 text-pink-300 rounded-lg border border-pink-600/30 hover:bg-pink-600/20 transition-colors duration-200"
              >
                {active.cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={
                active?.type === 'confirm' && active.destructive
                  ? 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200'
                  : 'px-4 py-2 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 text-white rounded-lg font-semibold hover:from-pink-500 hover:via-pink-400 hover:to-pink-600 transition-all duration-300 shadow-xl shadow-pink-500/30 border border-pink-500/30'
              }
            >
              {active?.confirmText ?? 'OK'}
            </button>
          </div>
        </div>
      </Modal>
    </DialogContext.Provider>
  );
}
