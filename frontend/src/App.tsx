// main entry point for the React application
// CareCraft
// a simulation application for training customer service agents
// using a virtual agentic assistant
// and a deep evaluation system

import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainPage from './components/MainPage';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {

  return (
    <ErrorBoundary>
      <Router>
        <div>
          <nav style={{
            padding: '1rem',
            background: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>CareCraft</h3>
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                color: '#667eea',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
            >
              Training Simulator
            </Link>
          </nav>

          <Routes>
            <Route path="/" element={<MainPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
