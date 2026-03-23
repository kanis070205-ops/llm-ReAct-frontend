import { useState } from "react";

function LLMForm() {
  const [selectedLLM, setSelectedLLM] = useState("OpenAI");

  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  const [message, setMessage] = useState("");

  const llms = ["OpenAI", "Anthropic", "Gemini", "Azure", "AWS", "Ollama"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!apiUrl || !apiKey || !model) {
      alert("All fields are mandatory");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/llm-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedLLM,
          api_url: apiUrl,
          api_key: apiKey,
          model: model,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const data = await res.json();
      console.log(data);

      // ✅ success message
      setMessage("Configuration saved successfully");

      // ✅ clear form
      setApiUrl("");
      setApiKey("");
      setModel("");

      // auto hide message
      setTimeout(() => setMessage(""), 3000);

    } catch (err) {
      console.error(err);
      alert("Error saving");
    }
  };

  return (
    <div className="card">
      <h1>LLM Configuration</h1>

      {/* Tabs */}
      <div className="tabs">
        {llms.map((llm) => (
          <button
            key={llm}
            type="button"
            className={selectedLLM === llm ? "active" : ""}
            onClick={() => setSelectedLLM(llm)}
          >
            {llm}
          </button>
        ))}
      </div>



      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>
              API URL <span className="required">*</span>
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>

          <div>
            <label>
              API Key <span className="required">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div>
            <label>
              Model <span className="required">*</span>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </div>
        {/* ✅ Success Message */}
        {message && <div className="success-msg">{message}</div>}
        <button className="save-btn" type="submit">
          Save Configuration
        </button>
      </form>
    </div>
  );
}

export default LLMForm;