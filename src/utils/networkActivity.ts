import { useEffect, useState } from 'react';

let activeRequests = 0;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const beginNetworkActivity = () => {
  activeRequests += 1;
  notify();

  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    activeRequests = Math.max(0, activeRequests - 1);
    notify();
  };
};

export const hasActiveNetworkActivity = () => activeRequests > 0;

export const useNetworkActivityActive = () => {
  const [active, setActive] = useState(hasActiveNetworkActivity());

  useEffect(() => {
    const listener = () => setActive(hasActiveNetworkActivity());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return active;
};
