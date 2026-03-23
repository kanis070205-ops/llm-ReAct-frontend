import { createContext, useContext, useState, useEffect } from "react";

const AgentsContext = createContext();

const DEFAULT_GROUPS = ["Development", "Code Quality"];

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
      setAgents(data);
      const g = DEFAULT_GROUPS.reduce((acc, cat) => {
        acc[cat] = data.filter((a) => a.category === cat);
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

  return (
    <AgentsContext.Provider value={{ agents, grouped, addAgent }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  return useContext(AgentsContext);
}
