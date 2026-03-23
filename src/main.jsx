import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import LLMForm from "./components/LLMForm";
import Agents from "./components/Agents";
import { AgentsProvider } from "./AgentsContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AgentsProvider>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/llm-config" replace />} />
          <Route path="llm-config" element={<LLMForm />} />
          <Route path="agents" element={<Agents />} />
          <Route path="tasks" element={<div className="placeholder"><h2>Tasks</h2><p>Coming soon.</p></div>} />
          <Route path="tools" element={<div className="placeholder"><h2>Tools</h2><p>Coming soon.</p></div>} />
          <Route path="scheduler" element={<div className="placeholder"><h2>Scheduler</h2><p>Coming soon.</p></div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AgentsProvider>
  </BrowserRouter>
);
