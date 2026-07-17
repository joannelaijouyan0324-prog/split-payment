"use client";

import { useEffect, useState } from "react";

type ToastNoticeProps = {
  message: string;
};

export function ToastNotice({ message }: ToastNoticeProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message || !visible) return null;

  return (
    <div className="toast-notice" role="status" aria-live="polite">
      {message}
    </div>
  );
}
