import { NavLink } from "react-router-dom";

const MENU_ITEMS = [
  { name: "Home", path: "/", end: true },
  { name: "LLM Configuration", path: "/llm-config" },
  { name: "Agents", path: "/agents" },
  { name: "Tasks", path: "/tasks" },
  { name: "Scheduler", path: "/scheduler" },
  { name: "History", path: "/history" },
];

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="logo">ReAct LLM</h2>
      <ul className="menu">
        {MENU_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.end || false}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
