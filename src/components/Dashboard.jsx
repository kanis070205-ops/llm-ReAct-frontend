import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STAT_CONFIG = [
  {
    key: "agents",
    label: "Agents",
    icon: "🤖",
    color: "#4b2aad",
    bg: "#ede9fe",
    path: "/agents",
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: "📋",
    color: "#0369a1",
    bg: "#e0f2fe",
    path: "/tasks",
  },
  {
    key: "tools",
    label: "Tools",
    icon: "🔧",
    color: "#065f46",
    bg: "#d1fae5",
    path: "/tools",
  },
  {
    key: "llmConfigs",
    label: "LLM Configs",
    icon: "⚡",
    color: "#92400e",
    bg: "#fef3c7",
    path: "/llm-config",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ agents: 0, tasks: 0, tools: 0, llmConfigs: 0 });
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:8000/agents").then((r) => r.json()).catch(() => []),
      fetch("http://127.0.0.1:8000/tasks").then((r) => r.json()).catch(() => []),
      fetch("http://127.0.0.1:8000/tools").then((r) => r.json()).catch(() => []),
      fetch("http://127.0.0.1:8000/llm-config").then((r) => r.json()).catch(() => []),
    ]).then(([agentsData, tasksData, toolsData, llmData]) => {
      setAgents(agentsData);
      setTasks(tasksData);
      setTools(toolsData);
      setCounts({
        agents: agentsData.length,
        tasks: tasksData.length,
        tools: toolsData.length,
        llmConfigs: llmData.length,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">ReAct LLM </h1>
          <p className="dashboard-subtitle">Overview of your agents, tasks, and tools</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {STAT_CONFIG.map((s) => (
          <div
            key={s.key}
            className="stat-card"
            style={{ "--accent": s.color, "--accent-bg": s.bg }}
            onClick={() => navigate(s.path)}
          >
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <div className="stat-count">
                {loading ? <span className="stat-skeleton" /> : counts[s.key]}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
            <div className="stat-arrow">→</div>
          </div>
        ))}
      </div>

      {/* Bottom grid: Agents + Tasks + Tools */}
      <div className="dash-grid">

        {/* Recent Agents */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span>🤖 Agents</span>
            <button className="dash-link" onClick={() => navigate("/agents")}>View all</button>
          </div>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : agents.length === 0 ? (
            <div className="dash-empty">No agents yet</div>
          ) : (
            <ul className="dash-list">
              {agents.slice(0, 6).map((a) => (
                <li key={a.id} className="dash-list-item">
                  <div className="dash-item-dot" style={{ background: "#4b2aad" }} />
                  <div>
                    <div className="dash-item-name">{a.name}</div>
                    <div className="dash-item-sub">{a.category}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span>📋 Tasks</span>
            <button className="dash-link" onClick={() => navigate("/tasks")}>View all</button>
          </div>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="dash-empty">No tasks yet</div>
          ) : (
            <ul className="dash-list">
              {tasks.slice(0, 6).map((t) => (
                <li key={t.id} className="dash-list-item">
                  <div className="dash-item-dot" style={{ background: "#0369a1" }} />
                  <div>
                    <div className="dash-item-name">{t.name}</div>
                    <div className="dash-item-sub">
                      {(t.agent_ids || []).length} agent{(t.agent_ids || []).length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tools */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span>🔧 Tools</span>
            <button className="dash-link" onClick={() => navigate("/tools")}>View all</button>
          </div>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : tools.length === 0 ? (
            <div className="dash-empty">No tools available</div>
          ) : (
            <ul className="dash-list">
              {tools.map((t) => (
                <li key={t.name} className="dash-list-item">
                  <div className="dash-item-dot" style={{ background: "#065f46" }} />
                  <div>
                    <div className="dash-item-name">{t.name}</div>
                    <div className="dash-item-sub">{t.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
