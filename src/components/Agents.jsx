import { useState, useEffect } from "react";
import { useAgents } from "../AgentsContext";

const DEFAULT_GROUPS = ["Development", "Code Quality"];

function Agents() {
  const { grouped, addAgent } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState("");
  const [skillsFileName, setSkillsFileName] = useState("");
  const [selectedLlm, setSelectedLlm] = useState("");
  const [llmConfigs, setLlmConfigs] = useState([]);

  // dry run
  const [dryPrompt, setDryPrompt] = useState("");
  const [dryOutput, setDryOutput] = useState("");
  const [dryRunning, setDryRunning] = useState(false);

  // status
  const [nameStatus, setNameStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // load LLM configs for dropdown
  useEffect(() => {
    fetch("http://127.0.0.1:8000/llm-config")
      .then((r) => r.json())
      .then(setLlmConfigs)
      .catch(() => {});
  }, []);

  const checkName = async () => {
    if (!name) return;
    const res = await fetch(
      `http://127.0.0.1:8000/agents/check-name?name=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    setNameStatus(data.exists ? "❌ Already exists" : "✅ Available");
  };

  const handleMdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".md")) {
      alert("Please upload a .md file.");
      return;
    }
    setSkillsFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setSkills(ev.target.result);
    reader.readAsText(file);
  };

  const handleDryRun = async () => {
    if (!dryPrompt || !selectedLlm) return;
    setDryRunning(true);
    setDryOutput("");
    try {
      const res = await fetch("http://127.0.0.1:8000/agents/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          skills,
          prompt: dryPrompt,
          llm_config_id: selectedLlm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDryOutput(`Error: ${data.detail || "LLM call failed."}`);
      } else {
        setDryOutput(data.output);
      }
    } catch {
      setDryOutput("Error: could not reach backend.");
    } finally {
      setDryRunning(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setSkills("");
    setSkillsFileName("");
    setSelectedLlm("");
    setDryPrompt("");
    setDryOutput("");
    setNameStatus("");
    setFormError("");
  };

  const handleCreate = async () => {
    if (!name || !description || !category) {
      setFormError("Name, description, and category are required.");
      return;
    }
    if (!selectedLlm) {
      setFormError("LLM Configuration is required.");
      return;
    }
    if (nameStatus === "❌ Already exists") {
      setFormError("Agent name already exists. Choose a different name.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          skills,
          llm_config_id: selectedLlm || null,
        }),
      });
      if (!res.ok) {
        setFormError("Failed to create agent. Please try again.");
        return;
      }
      const newAgent = await res.json();
      addAgent(newAgent);
      setSelectedAgent(newAgent);
      resetForm();
      setShowForm(false);
    } catch {
      setFormError("Network error. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="agents-page">
      {/* ── LEFT PANEL ── */}
      <div className="agents-left">
        <div className="agents-left-header">
          <span>Agents</span>
          <button
            className="add-agent-btn"
            onClick={() => { resetForm(); setShowForm(true); setSelectedAgent(null); }}
          >
            + New
          </button>
        </div>

        {DEFAULT_GROUPS.map((grp) => (
          <div key={grp} className="agent-group">
            <div className="group-title">{grp}</div>
            <ul>
              {(grouped[grp] || []).length > 0 ? (
                (grouped[grp] || []).map((a) => (
                  <li
                    key={a.id}
                    className={selectedAgent?.id === a.id ? "active" : ""}
                    onClick={() => { setSelectedAgent(a); setShowForm(false); }}
                  >
                    {a.name}
                  </li>
                ))
              ) : (
                <li className="empty">No agents yet</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="agents-right">

        {/* CREATE FORM */}
        {showForm && (
          <div className="card agent-card">
            <h2>Create Agent</h2>

            <label>Agent Name *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameStatus(""); }}
              onBlur={checkName}
              placeholder="e.g. Code Reviewer"
            />
            {nameStatus && <div className="name-status">{nameStatus}</div>}

            <label>Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
            />

            <label>Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {DEFAULT_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Skills — textarea + md upload */}
            <label>Skills</label>
            <textarea
              rows={3}
              value={skills}
              onChange={(e) => { setSkills(e.target.value); setSkillsFileName(""); }}
              placeholder="Describe skills, or upload a .md file below"
            />
            <div className="upload-row">
              <label className="upload-btn" htmlFor="md-upload">
                📄 Upload .md
              </label>
              <input
                id="md-upload"
                type="file"
                accept=".md"
                style={{ display: "none" }}
                onChange={handleMdUpload}
              />
              {skillsFileName && (
                <span className="file-name">✅ {skillsFileName}</span>
              )}
            </div>

            {/* LLM Selection — mandatory */}
            <label>LLM Configuration *</label>
            <select value={selectedLlm} onChange={(e) => setSelectedLlm(e.target.value)}>
              <option value="">Select LLM</option>
              {llmConfigs.map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.provider} — {cfg.model}
                </option>
              ))}
            </select>
            {llmConfigs.length === 0 ? (
              <p className="hint warn">⚠ No LLM configs found. Add one in LLM Configuration first.</p>
            ) : (
              <p className="hint">Required to run and save the agent.</p>
            )}

            {/* Dry Run */}
            <div className="dry-run-section">
              <h3>Dry Run</h3>
              <p className="subtitle">Test this agent with a sample prompt before saving.</p>
              {!selectedLlm && (
                <p className="hint warn">⚠ Select an LLM above to enable dry run.</p>
              )}
              <textarea
                rows={3}
                placeholder="Enter a sample prompt or error to test..."
                value={dryPrompt}
                onChange={(e) => setDryPrompt(e.target.value)}
                disabled={!selectedLlm}
              />
              <button
                className="dry-run-btn"
                onClick={handleDryRun}
                disabled={dryRunning || !dryPrompt || !selectedLlm}
              >
                {dryRunning ? "Running..." : "▶ Run"}
              </button>
              {dryOutput && (
                <pre className="dry-output">{dryOutput}</pre>
              )}
            </div>

            {formError && <div className="status-msg error">{formError}</div>}

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleCreate} disabled={saving}>
                {saving ? "Saving..." : "Save Agent"}
              </button>
            </div>
          </div>
        )}

        {/* AGENT DETAIL */}
        {selectedAgent && !showForm && (
          <div className="card agent-card">
            <h2>{selectedAgent.name}</h2>
            <p className="subtitle">{selectedAgent.category}</p>

            <label>Description</label>
            <p>{selectedAgent.description}</p>

            {selectedAgent.skills && (
              <>
                <label>Skills</label>
                <pre className="skills-preview">{selectedAgent.skills}</pre>
              </>
            )}
          </div>
        )}

        {/* EMPTY STATE */}
        {!showForm && !selectedAgent && (
          <div className="empty-state">
            <p>Select an agent from the left, or click <strong>+ New</strong> to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Agents;
