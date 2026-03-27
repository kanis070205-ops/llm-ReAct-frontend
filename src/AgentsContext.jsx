import { createContext, useContext, useState, useEffect } from "react";

const AgentsContext = createContext();

const DEFAULT_GROUPS = ["Development", "Knowledge & Research"];

export function AgentsProvider({ children }) {
  const [agents, setAgents] = useState([]);
  const [grouped, setGrouped] = useState(
    DEFAULT_GROUPS.reduce((acc, g) => ({ ...acc, [g]: [] }), {})
  );

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/agents");
      const data = await res.json();
      const g = DEFAULT_GROUPS.reduce((acc, cat) => {
        acc[cat] = data.filter(
          (a) => (a.category || "").trim() === cat
        );
        return acc;
}, {});
      setGrouped(g);
    } catch (e) {
      console.error("Failed to fetch agents", e);
    }
  };

  const addAgent = (newAgent) => {
    setAgents((prev) => [...prev, newAgent]);
    setGrouped((prev) => {
      const updated = { ...prev };
      const cat = newAgent.category;
      updated[cat] = [...(updated[cat] || []), newAgent];
      return updated;
    });
  };

  const updateAgent = (updated) => {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setGrouped((prev) => {
      const next = DEFAULT_GROUPS.reduce((acc, g) => ({ ...acc, [g]: [] }), {});
      [...agents.filter((a) => a.id !== updated.id), updated].forEach((a) => {
        const cat = a.category;
        if (next[cat]) next[cat].push(a);
      });
      return next;
    });
  };

  return (
    <AgentsContext.Provider value={{ agents, grouped, addAgent, updateAgent }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  return useContext(AgentsContext);
}
