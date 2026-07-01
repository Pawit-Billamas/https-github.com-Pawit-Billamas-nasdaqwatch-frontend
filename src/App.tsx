import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import Compare from './pages/Compare';
import Calendar from './pages/Calendar';
import Alerts from './pages/Alerts';
import Discover from './pages/Discover';
import Insights from './pages/Insights';
import './index.css';

function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Topbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock/:ticker" element={<StockDetail />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/insights" element={<Insights />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LangProvider>
  );
}

export default App;
