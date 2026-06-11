// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let _prompt: BIPEvent | null = null;
const _listeners = new Set<() => void>();

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

if (!standalone()) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _prompt = e as BIPEvent;
    _listeners.forEach(fn => fn());
  });
}

export const getInstallPrompt = () => _prompt;
export const clearInstallPrompt = () => { _prompt = null; _listeners.forEach(fn => fn()); };
export const subscribeInstallPrompt = (fn: () => void) => {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
};
