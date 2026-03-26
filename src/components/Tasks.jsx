import { useState, useEffect } from "react";
import { useTasks } from "../TasksContext";

function Tasks() {
  const { tasks, addTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [workflow, setWorkflow] = useState("");

  // workflow generation
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [selectedLlm, setSelectedLlm] = useState("");
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);

  // dry run
  const [dryPrompt, setDryPrompt] = useState("");
  const [dryResults, setDryResults] = useState(null);
  const [dryRunning, setDryRunning] = useState(false);

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
    if (!name) return;
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
    if (!dryPrompt || !selectedLlm || selectedAgents.length === 0) return;
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
          llm_config_id: selectedLlm,
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

  const resetForm = () => {
    setName(""); setDescription(""); setSelectedAgents([]);
    setWorkflow(""); setSelectedLlm(""); setDryPrompt("");
    setDryResults(null); setNameStatus(""); setFormError("");
  };

  const handleCreate = async () => {
    if (!name || !description) {
      setFormError("Name and description are required.");
      return;
    }
    if (selectedAgents.length === 0) {
      setFormError("Select at least one agent.");
      return;
    }
    if (nameStatus === "❌ Already exists") {
      setFormError("Task name already exists.");
      return;
    }
    setSaving(true);
    setFormError("");
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
      resetForm();
      setShowForm(false);
    } catch {
      setFormError("Network error. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  const getAgentName = (id) => allAgents.find((a) => a.id === id)?.name || id;

  return (
    <div className="agents-page">
      {/* LEFT PANEL */}
      <div className="agents-left">
        <div className="agents-left-header">
          <span>Tasks</span>
          <button
            className="add-agent-btn"
            onClick={() => { resetForm(); setShowForm(true); setSelectedTask(null); }}
          >
            + New
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tasks.length === 0 ? (
            <li className="agent-group"><ul><li className="empty">No tasks yet</li></ul></li>
          ) : (
            tasks.map((t) => (
              <li
                key={t.id}
                className={`agent-group`}
                style={{ marginBottom: 2 }}
              >
                <div
                  className={`agent-group li ${selectedTask?.id === t.id ? "active" : ""}`}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    color: selectedTask?.id === t.id ? "#fff" : "#374151",
                    background: selectedTask?.id === t.id ? "#4b2aad" : "transparent",
                    fontWeight: selectedTask?.id === t.id ? 600 : 400,
                    transition: "background 0.15s",
                  }}
                  onClick={() => { setSelectedTask(t); setShowForm(false); }}
                >
                  {t.name}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* RIGHT PANEL */}
      <div className="agents-right">

        {/* CREATE FORM */}
        {showForm && (
          <div className="card agent-card">
            <h2>Create Task</h2>

            <label>Task Name *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameStatus(""); }}
              onBlur={checkName}
              placeholder="e.g. Daily Code Review"
            />
            {nameStatus && <div className="name-status">{nameStatus}</div>}

            <label>Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this task accomplish?"
            />

            {/* Agent selection */}
            <label>Assign Agents *</label>
            {allAgents.length === 0 ? (
              <p className="hint warn">⚠ No agents found. Create agents first.</p>
            ) : (
              <div className="tools-grid">
                {allAgents.map((agent) => (
                  <label key={agent.id} className="tool-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAgents.includes(agent.id)}
                      onChange={() => toggleAgent(agent.id)}
                    />
                    <span className="tool-label">
                      <strong>{agent.name}</strong>
                      <span className="tool-desc">{agent.category}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* LLM for workflow + dry run */}
            <label>LLM Configuration <span className="hint-inline">(for workflow & dry run)</span></label>
            <select value={selectedLlm} onChange={(e) => setSelectedLlm(e.target.value)}>
              <option value="">Select LLM</option>
              {llmConfigs.map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.provider} — {cfg.model}
                </option>
              ))}
            </select>

            {/* Workflow generation */}
            <div className="dry-run-section" style={{ marginTop: "1.5rem" }}>
              <h3>Workflow <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#6b7280" }}>(optional)</span></h3>
              <p className="subtitle">Ask the LLM to suggest a workflow for your agents, or write your own.</p>
              <button
                className="dry-run-btn"
                onClick={handleGenerateWorkflow}
                disabled={generatingWorkflow || !selectedLlm || !name || !description || selectedAgents.length === 0}
                style={{ marginBottom: 8 }}
              >
                {generatingWorkflow ? "Generating..." : "✨ Generate Workflow"}
              </button>
              <textarea
                rows={5}
                placeholder="Workflow steps will appear here, or type your own..."
                value={workflow}
                onChange={(e) => setWorkflow(e.target.value)}
              />
            </div>

            {/* Dry Run */}
            <div className="dry-run-section">
              <h3>Dry Run</h3>
              <p className="subtitle">Test this task across all assigned agents before saving.</p>
              {selectedAgents.length === 0 && (
                <p className="hint warn">⚠ Assign at least one agent to enable dry run.</p>
              )}
              {!selectedLlm && (
                <p className="hint warn">⚠ Select an LLM above to enable dry run.</p>
              )}
              <textarea
                rows={3}
                placeholder="Enter a sample prompt to test..."
                value={dryPrompt}
                onChange={(e) => setDryPrompt(e.target.value)}
                disabled={!selectedLlm || selectedAgents.length === 0}
              />
              <button
                className="dry-run-btn"
                onClick={handleDryRun}
                disabled={dryRunning || !dryPrompt || !selectedLlm || selectedAgents.length === 0}
              >
                {dryRunning ? "Running..." : "▶ Run"}
              </button>
              {dryResults && (
                <div style={{ marginTop: 12 }}>
                  {Object.entries(dryResults).map(([agentName, output]) => (
                    <div key={agentName} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4b2aad", marginBottom: 4 }}>
                        {agentName}
                      </div>
                      <pre className="dry-output">{output}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formError && <div className="status-msg error">{formError}</div>}

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleCreate} disabled={saving}>
                {saving ? "Saving..." : "Save Task"}
              </button>
            </div>
          </div>
        )}

        {/* TASK DETAIL */}
        {selectedTask && !showForm && (
          <div className="card agent-card">
            <h2>{selectedTask.name}</h2>
            <p className="subtitle">Task</p>

            <label>Description</label>
            <p>{selectedTask.description}</p>

            <label>Assigned Agents</label>
            <div className="tools-grid">
              {(selectedTask.agent_ids || []).map((id) => (
                <div key={id} className="tool-checkbox" style={{ cursor: "default" }}>
                  <span className="tool-label">
                    <strong>{getAgentName(id)}</strong>
                  </span>
                </div>
              ))}
            </div>

            {selectedTask.workflow && (
              <>
                <label>Workflow</label>
                <pre className="skills-preview">{selectedTask.workflow}</pre>
              </>
            )}
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
