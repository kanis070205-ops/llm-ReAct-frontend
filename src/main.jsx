import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Dashboard from "./components/Dashboard";
import LLMForm from "./components/LLMForm";
import Agents from "./components/Agents";
import Tasks from "./components/Tasks";
import ToolsMenu from "./components/ToolsMenu";
import Scheduler from "./components/Scheduler";
import History from "./components/History";
import { AgentsProvider } from "./AgentsContext";
import { TasksProvider } from "./TasksContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AgentsProvider>
      <TasksProvider>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="llm-config" element={<LLMForm />} />
            <Route path="agents" element={<Agents />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tools" element={<ToolsMenu />} />
            <Route path="scheduler" element={<Scheduler />} />
            <Route path="history" element={<History />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TasksProvider>
    </AgentsProvider>
  </BrowserRouter>
);
