import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme.css";
import App from "./App.jsx";
import ThemeSwitcher from "./ThemeSwitcher.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <ThemeSwitcher />
  </StrictMode>
);