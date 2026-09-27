import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'primary',
    operation: null,
    details: null,
    onConfirmCallback: null,
    onCancelCallback: null,
    isLoading: false,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'primary',
        operation: options.operation || null,
        details: options.details || null,
        isLoading: false,
        onConfirmCallback: async () => {
          if (options.onConfirm) {
            setModalState((prev) => ({ ...prev, isLoading: true }));
            try {
              await options.onConfirm();
              resolve(true);
            } catch (err) {
              console.error('Confirmation action error:', err);
              resolve(false);
            } finally {
              setModalState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
            }
          } else {
            setModalState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          }
        },
        onCancelCallback: () => {
          if (options.onCancel) options.onCancel();
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const handleClose = () => {
    if (modalState.onCancelCallback) modalState.onCancelCallback();
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={modalState.onConfirmCallback}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        operation={modalState.operation}
        details={modalState.details}
        isLoading={modalState.isLoading}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
