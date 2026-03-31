import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Main from './Pages/Form';
import Calendar from "./Pages/Calendar";
import MaterialsCalendar from "./Pages/MaterialsCalendar";

function App() {

  return (
    <>
      <Router>
        <div>
          <nav>
            <ul className="flex space-x-4 p-4 bg-gray-800 text-white">
              <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
              <li><Link to="/Calendar" className="hover:text-gray-300">Календар</Link></li>
              <li><Link to="/MaterialsCalendar" className="hover:text-gray-300">Матеріали</Link></li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/Calendar" element={<Calendar />} />
            <Route path="/MaterialsCalendar" element={<MaterialsCalendar />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
