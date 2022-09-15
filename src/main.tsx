import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App/App";
import "./index.css";
import ReloadPrompt from "./components/ReloadPrompt/ReloadPrompt";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <ReloadPrompt />
  </React.StrictMode>
);
