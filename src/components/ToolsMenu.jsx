import { useEffect, useState } from "react";
function ToolsMenu() {
    const [agents, setAgents] = useState([]);
    const [tools, setTools] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState("");
    const [selectedTools, setSelectedTools] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/agents")
            .then(res => res.json())
            .then(data => setAgents(data));
    }, []);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/tools")
            .then(res => res.json())
            .then(data => setTools(data));
    }, []);

    const toggleTool = (toolName) => {
        if (selectedTools.includes(toolName)) {
            setSelectedTools(selectedTools.filter(t => t !== toolName));
        } else {
            setSelectedTools([...selectedTools, toolName]);
        }
    };

    const saveTools = async () => {

        if (!selectedAgent) {
            alert("Select an agent first");
            return;
        }

        await fetch(`http://127.0.0.1:8000/agents/${selectedAgent}/tools`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(selectedTools)
        });

        alert("Tools assigned successfully");
    };

    return (
        <div className="card">
            <h2>Assign Tools to Agent</h2>
            {/* Agent Selector */}
            <label>Select Agent</label>
            <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
            >
                <option value="">Select agent</option>

                {agents.map(a => (
                    <option key={a.id} value={a.id}>
                        {a.name}
                    </option>
                ))}
            </select>
            {/* Tool List */}
            <h3>Available Tools</h3>
            {tools.map(tool => (
                <div key={tool.name}>
                    <label>
                        <input
                            type="checkbox"
                            checked={selectedTools.includes(tool.name)}
                            onChange={() => toggleTool(tool.name)}
                        />
                        {tool.name}
                    </label>
                </div>
            ))}
            {/* Save Button */}
            <button onClick={saveTools}>
                Save Tools
            </button>
        </div>
    );
}
export default ToolsMenu;