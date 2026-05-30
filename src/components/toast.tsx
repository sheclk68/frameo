"use client";

import { useEffect, useState } from "react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast" onClick={onClose}>
      {message}
    </div>
  );
}

// Hook to manage toast state
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
  };

  return {
    toast,
    showToast,
    ToastComponent: toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null,
  };
}
