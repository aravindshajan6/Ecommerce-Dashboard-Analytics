import { useState } from "react";
import "./App.css";
import Hero from "../components/Hero/Hero";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sales from "../components/Sales/Sales.jsx";
import Navbar from "../components/Navbar/Navbar.jsx";
import Customers from "../components/Customers/Customers.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/customers" element={<Customers />} />

          
          
          <Route path="*" element= {<Hero /> } />
        </Routes>
      </Router>
    </>
  );
}

export default App;
