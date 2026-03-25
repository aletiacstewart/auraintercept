import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('[main] Starting app...');

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[main] Unhandled promise rejection:', event.reason);
});

// Global error handler to catch module-level crashes
window.addEventListener('error', (event) => {
  console.error('[main] Global error:', event.message, event.filename, event.lineno);
});

try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('[main] App rendered successfully');
} catch(e) {
  console.error('[main] FATAL: App failed to render:', e);
  document.getElementById("root")!.innerHTML = '<div style="padding:20px;color:red;font-family:monospace"><h1>App crashed during initialization</h1><pre>' + String(e) + '</pre></div>';
}
