import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import "./styles.css";

function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
