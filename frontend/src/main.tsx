/* ============================================================
 📁 FILE: src/main.tsx
   → File khởi tạo gốc của ứng dụng React (entry point)
============================================================ */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css"; // import Tailwind CSS

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
