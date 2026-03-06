import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Feed from './pages/Feed';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <ReportIssue />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
