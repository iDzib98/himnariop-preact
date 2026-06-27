import { render } from 'preact';
import { App } from './App';

const initApp = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        onRegisteredSW(swUrl: string) {
          console.log('Service Worker registered:', swUrl);
        },
        onOfflineReady() {
          console.log('App ready to work offline');
        }
      });
    } catch {
      console.warn('PWA registration failed');
    }
  }

  render(<App />, document.getElementById('app')!);
};

initApp();
