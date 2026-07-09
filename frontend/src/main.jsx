import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Forward client logs and errors to the backend for terminal tracing
function sendLogToBackend(level, message) {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message })
  }).catch(() => {});
}

// Intercept window errors
window.onerror = function (message, source, lineno, colno, error) {
  sendLogToBackend('error', `UNHANDLED EXCEPTION: ${message} at ${source}:${lineno}:${colno} ${error ? error.stack : ''}`);
};

window.onunhandledrejection = function (event) {
  sendLogToBackend('error', `UNHANDLED PROMISE REJECTION: ${event.reason}`);
};

// Intercept console messages
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog.apply(console, args);
  sendLogToBackend('log', args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
};

console.info = (...args) => {
  originalInfo.apply(console, args);
  sendLogToBackend('info', args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
};

console.warn = (...args) => {
  originalWarn.apply(console, args);
  sendLogToBackend('warn', args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
};

console.error = (...args) => {
  originalError.apply(console, args);
  sendLogToBackend('error', args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
};

// E2E Autotest Helper
if (window.location.search.includes('autotest=true')) {
  console.info('[AUTOTEST] Starting automated test sequence...');
  setTimeout(() => {
    const input = document.querySelector('input[placeholder*="Ask"]');
    if (input) {
      console.info('[AUTOTEST] Found input field, typing query...');
      // Set input value in a way that React detects
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'Why did this machine fail recently?');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          console.info('[AUTOTEST] Submitting form...');
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else {
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) {
            console.info('[AUTOTEST] Found submit button, clicking...');
            submitBtn.click();
          } else {
            console.info('[AUTOTEST] Form/button not found, triggering enter...');
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }
      }, 1000);
    } else {
      console.error('[AUTOTEST] Input field not found!');
    }
  }, 4000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
