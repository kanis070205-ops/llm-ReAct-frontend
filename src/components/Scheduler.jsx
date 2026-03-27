import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

const TRIGGER_LABELS = {
  manual: "Manual only",
  interval: "Interval (every N seconds)",
  cron: "Cron expression",
  file_watch: "File change (workspace)",
  db_watch: "DB table change",
};

function Scheduler() {
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // form
  const [taskId, setTaskId] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [intervalSeconds, setIntervalSeconds] = useState("");
  const [cronExpr, setCronExpr] = useState("");
  const [watchPath, setWatchPath] = useState("");
  const [watchTable, setWatchTable] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // manual run
  const [runningId, setRunningId] = useState(null);
  const [runPrompt, setRunPrompt] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState("");

  useEffect(() => {
    fetchTasks();
    fetchSchedules();
  }, []);

  const fetchTasks = () =>
    fetch(`${API}/tasks`).then((r) => r.json()).then(setTasks).catch(() => {});

  const fetchSchedules = () =>
    fetch(`${API}/scheduler/schedules`).then((r) => r.json()).then(setSchedules).catch(() => {});

  const resetForm = () => {
    setTaskId(""); setTriggerType("manual"); setIntervalSeconds("");
    setCronExpr(""); setWatchPath(""); setWatchTable(""); setPrompt("");
    setFormError("");
  };

  const handleSave = async () => {
    if (!taskId) { setFormError("Select a task."); return; }
    if (triggerType === "interval" && !intervalSeconds) { setFormError("Enter interval seconds."); return; }
    if (triggerType === "cron" && !cronExpr) { setFormError("Enter cron expression."); return; }
    if (triggerType === "file_watch" && !watchPath) { setFormError("Enter file path."); return; }
    if (triggerType === "db_watch" && !watchTable) { setFormError("Enter table name."); return; }

    setSaving(true); setFormError("");
    try {
      const res = await fetch(`${API}/scheduler/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          trigger_type: triggerType,
          interval_seconds: triggerType === "interval" ? parseInt(intervalSeconds) : null,
          cron_expression: triggerType === "cron" ? cronExpr : null,
          watch_path: triggerType === "file_watch" ? watchPath : null,
          watch_table: triggerType === "db_watch" ? watchTable : null,
          prompt: prompt || null,
          enabled: true,
        }),
      });
      if (!res.ok) { setFormError("Failed to save schedule."); return; }
      const row = await res.json();
      setSchedules((prev) => [row, ...prev]);
      resetForm(); setShowForm(false);
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s) => {
    const res = await fetch(`${API}/scheduler/schedules/${s.id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      const { enabled } = await res.json();
      setSchedules((prev) => prev.map((x) => x.id === s.id ? { ...x, enabled } : x));
      if (selectedSchedule?.id === s.id) setSelectedSchedule((p) => ({ ...p, enabled }));
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/scheduler/schedules/${id}`, { method: "DELETE" });
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (selectedSchedule?.id === id) setSelectedSchedule(null);
  };

  const handleManualRun = async (taskIdToRun) => {
    setRunningId(taskIdToRun); setRunResult(null); setRunError("");
    try {
      const res = await fetch(`${API}/scheduler/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskIdToRun, prompt: runPrompt || null }),
      });
      const data = await res.json();
      if (res.ok) setRunResult(data.results);
      else setRunError(data.detail || "Run failed.");
    } catch {
      setRunError("Network error.");
    } finally {
      setRunningId(null);
    }
  };

  const getTaskName = (id) => tasks.find((t) => t.id === id)?.name || id;

  return (
    <div className="agents-page">
      {/* LEFT */}
      <div className="agents-left">
        <div className="agents-left-header">
          <span>Schedules</span>
          <button className="add-agent-btn" onClick={() => { resetForm(); setShowForm(true); setSelectedSchedule(null); }}>
            + New
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {schedules.length === 0 ? (
            <li className="agent-group"><ul><li className="empty">No schedules yet</li></ul></li>
          ) : (
            schedules.map((s) => (
              <li key={s.id} style={{ marginBottom: 2 }}>
                <div
                  className={`agent-group li`}
                  style={{
                    padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                    fontSize: "0.88rem",
                    color: selectedSchedule?.id === s.id ? "#fff" : "#374151",
                    background: selectedSchedule?.id === s.id ? "#4b2aad" : "transparent",
                    fontWeight: selectedSchedule?.id === s.id ? 600 : 400,
                    transition: "background 0.15s",
                    opacity: s.enabled ? 1 : 0.5,
                  }}
                  onClick={() => { setSelectedSchedule(s); setShowForm(false); setRunResult(null); setRunError(""); setRunPrompt(""); }}
                >
                  <div>{getTaskName(s.task_id)}</div>
                  <div style={{ fontSize: "0.75rem", color: selectedSchedule?.id === s.id ? "#c4b5fd" : "#9ca3af" }}>
                    {TRIGGER_LABELS[s.trigger_type] || s.trigger_type}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* RIGHT */}
      <div className="agents-right">

        {/* CREATE FORM */}
        {showForm && (
          <div className="card agent-card">
            <h2>New Schedule</h2>

            <label>Task *</label>
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">Select task</option>
              {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <label>Trigger Type *</label>
            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {triggerType === "interval" && (
              <>
                <label>Interval (seconds) *</label>
                <input type="number" min="10" value={intervalSeconds} onChange={(e) => setIntervalSeconds(e.target.value)} placeholder="e.g. 3600 for every hour" />
              </>
            )}

            {triggerType === "cron" && (
              <>
                <label>Cron Expression *</label>
                <input value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} placeholder="e.g. 0 9 * * 1-5  (weekdays at 9am)" />
                <p className="hint">Format: minute hour day month day_of_week</p>
              </>
            )}

            {triggerType === "file_watch" && (
              <>
                <label>Workspace File Path *</label>
                <input value={watchPath} onChange={(e) => setWatchPath(e.target.value)} placeholder="e.g. notes.txt" />
                <p className="hint">Relative to the workspace/ directory. Triggers on file modification.</p>
              </>
            )}

            {triggerType === "db_watch" && (
              <>
                <label>Supabase Table Name *</label>
                <input value={watchTable} onChange={(e) => setWatchTable(e.target.value)} placeholder="e.g. tasks" />
                <p className="hint">Triggers when the row count changes in this table.</p>
              </>
            )}

            <label>Prompt <span className="hint-inline">(optional — defaults to task description)</span></label>
            <textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt to send to agents when triggered" />

            {formError && <div className="status-msg error">{formError}</div>}

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
              <button className="save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Schedule"}</button>
            </div>
          </div>
        )}

        {/* SCHEDULE DETAIL */}
        {selectedSchedule && !showForm && (
          <div className="card agent-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2>{getTaskName(selectedSchedule.task_id)}</h2>
                <p className="subtitle">{TRIGGER_LABELS[selectedSchedule.trigger_type]}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="cancel-btn"
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  onClick={() => handleToggle(selectedSchedule)}
                >
                  {selectedSchedule.enabled ? "⏸ Disable" : "▶ Enable"}
                </button>
                <button
                  className="cancel-btn"
                  style={{ padding: "6px 14px", fontSize: "0.82rem", color: "#991b1b", borderColor: "#fca5a5" }}
                  onClick={() => handleDelete(selectedSchedule.id)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            {selectedSchedule.interval_seconds && (
              <><label>Interval</label><p>Every {selectedSchedule.interval_seconds}s</p></>
            )}
            {selectedSchedule.cron_expression && (
              <><label>Cron</label><p><code>{selectedSchedule.cron_expression}</code></p></>
            )}
            {selectedSchedule.watch_path && (
              <><label>Watching File</label><p><code>{selectedSchedule.watch_path}</code></p></>
            )}
            {selectedSchedule.watch_table && (
              <><label>Watching Table</label><p><code>{selectedSchedule.watch_table}</code></p></>
            )}
            {selectedSchedule.prompt && (
              <><label>Prompt</label><p>{selectedSchedule.prompt}</p></>
            )}

            {/* Manual Run */}
            <div className="dry-run-section" style={{ marginTop: "1.5rem" }}>
              <h3>▶ Run Now</h3>
              <p className="subtitle">Manually trigger this task immediately.</p>
              <textarea
                rows={2}
                placeholder="Optional prompt override..."
                value={runPrompt}
                onChange={(e) => setRunPrompt(e.target.value)}
              />
              <button
                className="dry-run-btn"
                onClick={() => handleManualRun(selectedSchedule.task_id)}
                disabled={runningId === selectedSchedule.task_id}
              >
                {runningId === selectedSchedule.task_id ? "Running..." : "▶ Run Now"}
              </button>
              {runError && <div className="status-msg error" style={{ marginTop: 8 }}>{runError}</div>}
              {runResult && (
                <div style={{ marginTop: 12 }}>
                  {Object.entries(runResult).map(([agentName, output]) => (
                    <div key={agentName} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4b2aad", marginBottom: 4 }}>{agentName}</div>
                      <pre className="dry-output">{output}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!showForm && !selectedSchedule && (
          <div className="empty-state">
            <p>Select a schedule or click <strong>+ New</strong> to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scheduler;
