import { useState, useEffect } from "react";
import { useTasks } from "../TasksContext";

function Tasks() {
  const { tasks, addTask, updateTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // form fields (create + edit share these)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [workflow, setWorkflow] = useState("");

  // workflow generation needs one LLM to write the plan
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [selectedLlm, setSelectedLlm] = useState("");
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);

  // dry run — no LLM selector, agents use their own
  const [dryPrompt, setDryPrompt] = useState("");
  const [dryResults, setDryResults] = useState(null);
  const [dryRunning, setDryRunning] = useState(false);

  // docker run
  const [dockerPrompt, setDockerPrompt] = useState("");
  const [dockerResult, setDockerResult] = useState(null);
  const [dockerRunning, setDockerRunning] = useState(false);
  const [dockerError, setDockerError] = useState("");

  // status
  const [nameStatus, setNameStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/agents")
      .then((r) => r.json())
      .then(setAllAgents)
      .catch(() => {});
    fetch("http://127.0.0.1:8000/llm-config")
      .then((r) => r.json())
      .then(setLlmConfigs)
      .catch(() => {});
  }, []);

  const toggleAgent = (id) =>
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  const checkName = async () => {
    if (!name || editMode) return;
    const res = await fetch(
      `http://127.0.0.1:8000/tasks/check-name?name=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    setNameStatus(data.exists ? "❌ Already exists" : "✅ Available");
  };

  const handleGenerateWorkflow = async () => {
    if (!selectedLlm || !name || !description || selectedAgents.length === 0) return;
    setGeneratingWorkflow(true);
    setWorkflow("");
    try {
      const res = await fetch("http://127.0.0.1:8000/tasks/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_name: name,
          task_description: description,
          agent_ids: selectedAgents,
          llm_config_id: selectedLlm,
        }),
      });
      const data = await res.json();
      if (res.ok) setWorkflow(data.workflow);
      else setFormError(data.detail || "Workflow generation failed.");
    } catch {
      setFormError("Could not reach backend.");
    } finally {
      setGeneratingWorkflow(false);
    }
  };

  const handleDryRun = async () => {
    if (!dryPrompt || selectedAgents.length === 0) return;
    setDryRunning(true);
    setDryResults(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/tasks/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_name: name,
          task_description: description,
          agent_ids: selectedAgents,
          workflow,
          prompt: dryPrompt,
        }),
      });
      const data = await res.json();
      if (res.ok) setDryResults(data.results);
      else setFormError(data.detail || "Dry run failed.");
    } catch {
      setFormError("Could not reach backend.");
    } finally {
      setDryRunning(false);
    }
  };

  const handleDockerRun = async (task) => {
    if (!dockerPrompt) return;
    setDockerRunning(true);
    setDockerResult(null);
    setDockerError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/run-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: task.id, prompt: dockerPrompt }),
      });
      const data = await res.json();
      if (res.ok) setDockerResult(data);
      else setDockerError(data.detail || "Container run failed.");
    } catch {
      setDockerError("Could not reach backend.");
    } finally {
      setDockerRunning(false);
    }
  };

  const resetForm = () => {
    setName(""); setDescription(""); setSelectedAgents([]);
    setWorkflow(""); setSelectedLlm(""); setDryPrompt("");
    setDryResults(null); setNameStatus(""); setFormError("");
    setDockerPrompt(""); setDockerResult(null); setDockerError("");
    setEditMode(false);
  };

  const handleCreate = async () => {
    if (!name || !description) { setFormError("Name and description are required."); return; }
    if (selectedAgents.length === 0) { setFormError("Select at least one agent."); return; }
    if (nameStatus === "❌ Already exists") { setFormError("Task name already exists."); return; }
    setSaving(true); setFormError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, agent_ids: selectedAgents, workflow }),
      });
      if (!res.ok) { setFormError("Failed to save task."); return; }
      const newTask = await res.json();
      addTask(newTask);
      setSelectedTask(newTask);
      resetForm(); setShowForm(false);
    } catch { setFormError("Network error. Is the backend running?"); }
    finally { setSaving(false); }
  };

  const handleEdit = (task) => {
    setName(task.name);
    setDescription(task.description);
    setSelectedAgents(task.agent_ids || []);
    setWorkflow(task.workflow || "");
    setDryPrompt(""); setDryResults(null);
    setNameStatus(""); setFormError("");
    setEditMode(true); setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!name || !description) { setFormError("Name and description are required."); return; }
    if (selectedAgents.length === 0) { setFormError("Select at least one agent."); return; }
    setSaving(true); setFormError("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, agent_ids: selectedAgents, workflow }),
      });
      if (!res.ok) { setFormError("Failed to update task."); return; }
      const updated = await res.json();
      updateTask(updated);
      setSelectedTask(updated);
      resetForm(); setShowForm(false);
    } catch { setFormError("Network error."); }
    finally { setSaving(false); }
  };

  const getAgentName = (id) => allAgents.find((a) => a.id === id)?.name || id;
  const getAgentLlm = (id) => {
    const agent = allAgents.find((a) => a.id === id);
    if (!agent) return null;
    const cfg = llmConfigs.find((c) => c.id === agent.llm_config_id);
    return cfg ? `${cfg.provider} — ${cfg.model}` : null;
  };

  return (
    <div className="agents-page">
      {/* LEFT PANEL */}
      <div className="agents-left">
        <div className="agents-left-header">
          <span>Tasks</span>
          <button className="add-agent-btn"
            onClick={() => { resetForm(); setShowForm(true); setSelectedTask(null); }}>
            + New
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tasks.length === 0 ? (
            <li className="agent-group"><ul><li className="empty">No tasks yet</li></ul></li>
          ) : tasks.map((t) => (
            <li key={t.id} style={{ marginBottom: 2 }}>
              <div
                style={{
                  padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                  fontSize: "0.88rem",
                  color: selectedTask?.id === t.id ? "#fff" : "#374151",
                  background: selectedTask?.id === t.id ? "#4b2aad" : "transparent",
                  fontWeight: selectedTask?.id === t.id ? 600 : 400,
                  transition: "background 0.15s",
                }}
                onClick={() => { setSelectedTask(t); setShowForm(false); setEditMode(false); }}
              >
                {t.name}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT PANEL */}
      <div className="agents-right">

        {/* CREATE / EDIT FORM */}
        {showForm && (
          <div className="card agent-card">
            <h2>{editMode ? "Edit Task" : "Create Task"}</h2>

            <label>Task Name *</label>
            <input value={name}
              onChange={(e) => { setName(e.target.value); setNameStatus(""); }}
              onBlur={checkName}
              placeholder="e.g. Daily Code Review"
              disabled={editMode}
            />
            {nameStatus && <div className="name-status">{nameStatus}</div>}

            <label>Description *</label>
            <textarea rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this task accomplish?" />

            {/* Agent selection — shows each agent's LLM */}
            <label>Assign Agents *</label>
            {allAgents.length === 0 ? (
              <p className="hint warn">⚠ No agents found. Create agents first.</p>
            ) : (
              <div className="tools-grid">
                {allAgents.map((agent) => {
                  const cfg = llmConfigs.find((c) => c.id === agent.llm_config_id);
                  return (
                    <label key={agent.id} className="tool-checkbox">
                      <input type="checkbox"
                        checked={selectedAgents.includes(agent.id)}
                        onChange={() => toggleAgent(agent.id)} />
                      <span className="tool-label">
                        <strong>{agent.name}</strong>
                        <span className="tool-desc">{agent.category}</span>
                        {cfg && (
                          <span className="tool-desc" style={{ color: "#9ca3af" }}>
                            {cfg.provider} — {cfg.model}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Workflow — LLM selector only here */}
            <div className="dry-run-section" style={{ marginTop: "1.5rem" }}>
              <h3>Workflow <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#6b7280" }}>(optional)</span></h3>
              <p className="subtitle">Ask an LLM to suggest a workflow, or write your own.</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <select value={selectedLlm} onChange={(e) => setSelectedLlm(e.target.value)}
                  style={{ flex: 1 }}>
                  <option value="">Select LLM for workflow generation</option>
                  {llmConfigs.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>{cfg.provider} — {cfg.model}</option>
                  ))}
                </select>
                <button className="dry-run-btn" onClick={handleGenerateWorkflow}
                  disabled={generatingWorkflow || !selectedLlm || !name || !description || selectedAgents.length === 0}
                  style={{ whiteSpace: "nowrap" }}>
                  {generatingWorkflow ? "Generating..." : "✨ Generate"}
                </button>
              </div>
              <textarea rows={5} placeholder="Workflow steps will appear here, or type your own..."
                value={workflow} onChange={(e) => setWorkflow(e.target.value)} />
            </div>

            {/* Dry Run — no LLM selector, each agent uses its own */}
            <div className="dry-run-section">
              <h3>Dry Run</h3>
              <p className="subtitle">
                Each agent runs with its own configured LLM. Outputs are passed sequentially.
              </p>
              {selectedAgents.length === 0 && (
                <p className="hint warn">⚠ Assign at least one agent to enable dry run.</p>
              )}
              <textarea rows={3} placeholder="Enter a sample prompt to test..."
                value={dryPrompt} onChange={(e) => setDryPrompt(e.target.value)}
                disabled={selectedAgents.length === 0} />
              <button className="dry-run-btn" onClick={handleDryRun}
                disabled={dryRunning || !dryPrompt || selectedAgents.length === 0}>
                {dryRunning ? "Running..." : "▶ Run"}
              </button>
              {dryResults && (
                <div style={{ marginTop: 12 }}>
                  {dryResults.steps?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4b2aad", marginBottom: 8 }}>
                        🐳 Container — ReAct Trace
                      </div>
                      {dryResults.steps.map((step, i) => (
                        <div key={i} style={{
                          background: "#f9fafb", border: "1px solid #e5e7eb",
                          borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: "0.82rem"
                        }}>
                          <div style={{ color: "#6b7280", marginBottom: 4 }}>
                            <strong style={{ color: "#374151" }}>Thought:</strong> {step.thought}
                          </div>
                          <div style={{ color: "#6b7280", marginBottom: 4 }}>
                            <strong style={{ color: "#374151" }}>Action:</strong>{" "}
                            <code style={{ background: "#ede9fe", color: "#4b2aad", padding: "1px 6px", borderRadius: 4 }}>
                              {step.action}
                            </code>{" "}
                            <span style={{ color: "#9ca3af" }}>← {step.action_input}</span>
                          </div>
                          <div style={{ color: "#6b7280" }}>
                            <strong style={{ color: "#374151" }}>Observation:</strong> {step.observation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ borderTop: "2px solid #4b2aad", paddingTop: 12 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4b2aad", marginBottom: 6 }}>✦ Final Answer</div>
                    <pre className="dry-output">{dryResults.final_answer}</pre>
                  </div>
                </div>
              )}
            </div>

            {formError && <div className="status-msg error">{formError}</div>}

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
              <button className="save-btn" onClick={editMode ? handleUpdate : handleCreate} disabled={saving}>
                {saving ? "Saving..." : editMode ? "Update Task" : "Save Task"}
              </button>
            </div>
          </div>
        )}

        {/* TASK DETAIL */}
        {selectedTask && !showForm && (
          <div className="card agent-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2>{selectedTask.name}</h2>
                <p className="subtitle">Task</p>
              </div>
              <button className="dry-run-btn" onClick={() => handleEdit(selectedTask)}>✏ Edit</button>
            </div>

            <label>Description</label>
            <p>{selectedTask.description}</p>

            <label>Assigned Agents</label>
            <div className="tools-grid">
              {(selectedTask.agent_ids || []).map((id) => {
                const llmLabel = getAgentLlm(id);
                return (
                  <div key={id} className="tool-checkbox" style={{ cursor: "default" }}>
                    <span className="tool-label">
                      <strong>{getAgentName(id)}</strong>
                      {llmLabel && (
                        <span className="tool-desc" style={{ color: "#9ca3af" }}>{llmLabel}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedTask.workflow && (
              <>
                <label>Workflow</label>
                <pre className="skills-preview">{selectedTask.workflow}</pre>
              </>
            )}

            {/* Docker Run */}
            <div className="dry-run-section" style={{ marginTop: "1.5rem" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🐳 Run in Docker</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#6b7280" }}>
                  Full ReAct loop inside isolated container
                </span>
              </h3>
              <textarea
                rows={3}
                placeholder="Enter a prompt to run inside the container..."
                value={dockerPrompt}
                onChange={(e) => setDockerPrompt(e.target.value)}
              />
              <button
                className="dry-run-btn"
                onClick={() => handleDockerRun(selectedTask)}
                disabled={dockerRunning || !dockerPrompt}
                style={{ marginTop: 8 }}
              >
                {dockerRunning ? "⏳ Running container..." : "▶ Run Container"}
              </button>

              {dockerError && (
                <div className="status-msg error" style={{ marginTop: 8 }}>{dockerError}</div>
              )}

              {dockerResult && (
                <div style={{ marginTop: 16 }}>
                  {/* ReAct Steps */}
                  {dockerResult.steps?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4b2aad", marginBottom: 8 }}>
                        ReAct Trace
                      </div>
                      {dockerResult.steps.map((step, i) => (
                        <div key={i} style={{
                          background: "#f9fafb", border: "1px solid #e5e7eb",
                          borderRadius: 8, padding: "10px 14px", marginBottom: 8,
                          fontSize: "0.82rem"
                        }}>
                          <div style={{ color: "#6b7280", marginBottom: 4 }}>
                            <strong style={{ color: "#374151" }}>Thought:</strong> {step.thought}
                          </div>
                          <div style={{ color: "#6b7280", marginBottom: 4 }}>
                            <strong style={{ color: "#374151" }}>Action:</strong>{" "}
                            <code style={{ background: "#ede9fe", color: "#4b2aad", padding: "1px 6px", borderRadius: 4 }}>
                              {step.action}
                            </code>{" "}
                            <span style={{ color: "#9ca3af" }}>← {step.action_input}</span>
                          </div>
                          <div style={{ color: "#6b7280" }}>
                            <strong style={{ color: "#374151" }}>Observation:</strong> {step.observation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Final Answer */}
                  <div style={{ borderTop: "2px solid #4b2aad", paddingTop: 12 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4b2aad", marginBottom: 6 }}>
                      ✦ Final Answer
                    </div>
                    <pre className="dry-output">{dockerResult.final_answer}</pre>
                  </div>

                  {dockerResult.error && (
                    <div className="status-msg error" style={{ marginTop: 8 }}>
                      {dockerResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!showForm && !selectedTask && (
          <div className="empty-state">
            <p>Select a task from the left, or click <strong>+ New</strong> to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;
