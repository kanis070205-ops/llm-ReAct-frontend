import Sidebar from "./components/Sidebar";
import LLMForm from "./components/LLMForm";

function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <LLMForm />
      </div>
    </div>
  );
}

export default App;