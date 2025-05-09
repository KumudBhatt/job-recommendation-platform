import React, { useState } from 'react';

const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const addToast = (message, type = 'info') => {
  const event = new CustomEvent('toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  React.useEffect(() => {
    const handleToast = (event) => {
      const { message, type } = event.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 5000);
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-2 text-white shadow-lg transform transition-all duration-300 ease-in-out ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer; 