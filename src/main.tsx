import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

function initializeApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Fatal: Could not locate #root element in document.');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (mountError: any) {
    console.error('Fatal React root mounting error:', mountError);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center;">
        <div style="max-width: 400px; background: #0f172a; border: 1px solid #dc2626; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="color: #f87171; font-size: 18px; font-weight: 700; margin-bottom: 8px;">Initialization Notice</div>
          <div style="color: #94a3b8; font-size: 13px; margin-bottom: 16px; line-height: 1.4;">
            ${mountError?.message || 'The application encountered an issue while initializing.'}
          </div>
          <button onclick="window.location.reload()" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer;">
            Reload Application
          </button>
        </div>
      </div>
    `;
  }
}

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
