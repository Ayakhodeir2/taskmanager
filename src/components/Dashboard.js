import { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../UserContext';
import '../styles/theme.css';
import '../global.css';


const Dashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">📝 TaskManager</div>
        <div className="user-info">
          <span>Welcome, {user?.username || 'User'}</span>
          <button className="button-primary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
  <nav>
    <ul>
      <li><Link to="/dashboard">Dashboard</Link></li>
      <li><Link to="/tasks/all">My Tasks</Link></li>
      <li><Link to="/tasks/create">Add New Task</Link></li>
      <li><Link to="/tasks/edit">Edit Task</Link></li>
      <li><Link to="/tasks/delete">Delete Task</Link></li>
      <li><Link to="/tasks/search">Search Task by ID</Link></li>
      
    </ul>
  </nav>
</aside>

        {/* Main Content */}
        <main className="main-content">
          <h2>Welcome to your Task Management Dashboard</h2>
          <p>Select an option from the sidebar to manage your tasks.</p>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
