import { useState, useEffect } from "react";

const PROVIDERS = [
  { label: "OpenAI", value: "openai", defaultUrl: "https://api.openai.com/v1" },
  { label: "Anthropic", value: "anthropic", defaultUrl: "https://api.anthropic.com" },
  { label: "Ollama", value: "ollama", defaultUrl: "http://localhost:11434" },
  { label: "Azure OpenAI", value: "azure", defaultUrl: "https://<resource>.openai.azure.com" },
  { label: "Groq", value: "groq", defaultUrl: "https://api.groq.com/openai/v1" },
  { label: "Gemini", value: "groq", defaultUrl: "https://api.groq.com/openai/v1" },
];

function LLMForm() {
  const [provider, setProvider] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/llm-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          const cfg = data[0];
          setProvider(cfg.provider || "");
          setApiUrl(cfg.api_url || "");
          setModel(cfg.model || "");
          // api_key is encrypted server-side — don't prefill
        }
      })
      .catch(() => {});
  }, []);

  const handleProviderChange = (val) => {
    setProvider(val);
    const found = PROVIDERS.find((p) => p.value === val);
    if (found) setApiUrl(found.defaultUrl);
  };

  const handleSave = async () => {
    if (!provider || !apiUrl || !apiKey || !model) {
      setStatus({ type: "error", msg: "All fields are required." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/llm-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_url: apiUrl,
          api_key: apiKey,
          model,
        }),
      });
      if (res.ok) {
        setStatus({ type: "success", msg: "Configuration saved successfully." });
        setApiKey("");
      } else {
        setStatus({ type: "error", msg: "Failed to save. Please try again." });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>LLM Configuration</h2>
      <p className="subtitle">Configure the language model provider for your agents.</p>

      <label>Provider</label>
      <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
        <option value="">Select a provider</option>
        {PROVIDERS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <label>API URL</label>
      <input
        type="text"
        placeholder="https://api.example.com/v1"
        value={apiUrl}
        onChange={(e) => setApiUrl(e.target.value)}
      />

      <label>API Key</label>
      <div className="input-row">
        <input
          type={showKey ? "text" : "password"}
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button className="toggle-btn" onClick={() => setShowKey((s) => !s)}>
          {showKey ? "Hide" : "Show"}
        </button>
      </div>
      <p className="hint">Your key is encrypted before being stored.</p>

      <label>Model</label>
      <input
        type="text"
        placeholder="e.g. gpt-4o, claude-3-5-sonnet, llama3"
        value={model}
        onChange={(e) => setModel(e.target.value)}
      />

      {status && (
        <div className={`status-msg ${status.type}`}>{status.msg}</div>
      )}

      <button className="save-btn" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  );
}

export default LLMForm;
