import "./App.css";
import Hero from "../components/Hero/Hero";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Sales from "../components/Sales/Sales.jsx";
import Navbar from "../components/Navbar/Navbar.jsx";
import Customers from "../components/Customers/Customers.jsx";
import VerticalSidebar from "../components/Navbar/VerticalSidebar.jsx";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="flex">
      {location.pathname !== "/" && <VerticalSidebar />}
      <div className={`flex-grow ${location.pathname !== "/" ? "ml-64" : ""}`}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="*" element={<Hero />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
