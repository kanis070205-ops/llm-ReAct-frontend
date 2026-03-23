const menuItems = [
  "Home",
  "LLM Configuration",
  "Agents",
  "Tasks",
  "Tools",
  "Scheduler",
];

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="logo">AI Console</h2>

      <ul className="menu">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={item === "LLM Configuration" ? "active" : ""}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;