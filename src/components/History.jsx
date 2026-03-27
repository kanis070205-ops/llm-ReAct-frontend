import { useState, useEffect, useCallback } from "react";

const API = "http://127.0.0.1:8000";

const STATUS_COLORS = { success: "#065f46", error: "#991b1b", running: "#92400e" };
const STATUS_BG = { success: "#ecfdf5", error: "#fef2f2", running: "#fffbeb" };
const STATUS_BORDER = { success: "#6ee7b7", error: "#fca5a5", running: "#fcd34d" };

const TRIGGER_ICONS = {
  manual: "🖱",
  interval: "⏱",
  cron: "📅",
  file_watch: "📁",
  db_watch: "🗄",
};

function History() {
  const [runs, setRuns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [filterTaskId, setFilterTaskId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterTaskId
        ? `${API}/scheduler/history?task_id=${filterTaskId}&limit=200`
        : `${API}/scheduler/history?limit=200`;
      const data = await fetch(url).then((r) => r.json());
      setRuns(Array.isArray(data) ? data : []);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [filterTaskId]);

  useEffect(() => {
    fetch(`${API}/tasks`).then((r) => r.json()).then(setTasks).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleDelete = async (id) => {
    await fetch(`${API}/scheduler/history/${id}`, { method: "DELETE" });
    setRuns((prev) => prev.filter((r) => r.id !== id));
    if (selectedRun?.id === id) setSelectedRun(null);
  };

  const getTaskName = (run) => run.tasks?.name || tasks.find((t) => t.id === run.task_id)?.name || run.task_id;

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="agents-page">
      {/* LEFT */}
      <div className="agents-left" style={{ width: 280, minWidth: 280 }}>
        <div className="agents-left-header">
          <span>Run History</span>
          <button className="add-agent-btn" onClick={fetchRuns} title="Refresh">↻</button>
        </div>

        {/* Filter */}
        <select
          value={filterTaskId}
          onChange={(e) => setFilterTaskId(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1c4f7", fontSize: "0.82rem", background: "#faf9ff" }}
        >
          <option value="">All tasks</option>
          {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {loading && <div className="dash-loading">Loading...</div>}

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {runs.length === 0 && !loading && (
            <li className="agent-group"><ul><li className="empty">No runs yet</li></ul></li>
          )}
          {runs.map((run) => (
            <li key={run.id} style={{ marginBottom: 2 }}>
              <div
                style={{
                  padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                  background: selectedRun?.id === run.id ? "#4b2aad" : "transparent",
                  transition: "background 0.15s",
                }}
                onClick={() => setSelectedRun(run)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem" }}>{TRIGGER_ICONS[run.trigger_type] || "▶"}</span>
                  <span style={{
                    fontSize: "0.85rem", fontWeight: 500,
                    color: selectedRun?.id === run.id ? "#fff" : "#1e1b4b",
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {getTaskName(run)}
                  </span>
                  <span style={{
                    fontSize: "0.7rem", padding: "1px 6px", borderRadius: 10,
                    background: STATUS_BG[run.status], color: STATUS_COLORS[run.status],
                    border: `1px solid ${STATUS_BORDER[run.status]}`,
                    flexShrink: 0,
                  }}>
                    {run.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: selectedRun?.id === run.id ? "#c4b5fd" : "#9ca3af", marginTop: 2, paddingLeft: 22 }}>
                  {formatDate(run.ran_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT */}
      <div className="agents-right">
        {selectedRun ? (
          <div className="card agent-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2>{getTaskName(selectedRun)}</h2>
                <p className="subtitle">
                  {TRIGGER_ICONS[selectedRun.trigger_type]} {selectedRun.trigger_type} &nbsp;·&nbsp; {formatDate(selectedRun.ran_at)}
                </p>
              </div>
              <button
                className="cancel-btn"
                style={{ padding: "6px 14px", fontSize: "0.82rem", color: "#991b1b", borderColor: "#fca5a5" }}
                onClick={() => handleDelete(selectedRun.id)}
              >
                🗑 Delete
              </button>
            </div>

            {/* Status badge */}
            <div style={{
              display: "inline-block", marginTop: 8, padding: "4px 12px", borderRadius: 20,
              background: STATUS_BG[selectedRun.status], color: STATUS_COLORS[selectedRun.status],
              border: `1px solid ${STATUS_BORDER[selectedRun.status]}`,
              fontSize: "0.85rem", fontWeight: 600,
            }}>
              {selectedRun.status === "success" ? "✓" : "✗"} {selectedRun.status}
            </div>

            {selectedRun.prompt && (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#4b2aad", margin: "1rem 0 4px" }}>Prompt</label>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151" }}>{selectedRun.prompt}</p>
              </>
            )}

            {selectedRun.status === "error" && selectedRun.error && (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#991b1b", margin: "1rem 0 4px" }}>Error</label>
                <pre className="dry-output" style={{ background: "#1f0a0a", color: "#fca5a5" }}>{selectedRun.error}</pre>
              </>
            )}

            {selectedRun.output && Object.keys(selectedRun.output).length > 0 && (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#4b2aad", margin: "1rem 0 4px" }}>Agent Outputs</label>
                {Object.entries(selectedRun.output).map(([agentName, output]) => (
                  <div key={agentName} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4b2aad", marginBottom: 4 }}>{agentName}</div>
                    <pre className="dry-output">{typeof output === "string" ? output : JSON.stringify(output, null, 2)}</pre>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a run from the left to see details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
