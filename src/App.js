// App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Signup from './components/Signups';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { UserContext } from './UserContext';
import GetTaskById from './components/tasks/GetTaskById';
import CreateTask from './components/tasks/CreateTask';
import UpdateTask from './components/tasks/UpdateTask';
import GetAllTasks from './components/tasks/GetAllTasks';
import DeleteTask from './components/tasks/DeleteTask';
import ConfirmSignup from './components/ConfirmSignUp';
import './global.css';
import './styles/theme.css';


function App() {
  const { user } = useContext(UserContext);

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
         <Route path="/confirm" element={<ConfirmSignup />} />
       <Route path="/tasks/all" element={<GetAllTasks />} />
<Route path="/tasks/create" element={<CreateTask />} />
<Route path="/tasks/edit" element={<UpdateTask />} />
<Route path="/tasks/delete" element={<DeleteTask />} />
<Route path="/tasks/search" element={<GetTaskById />} />


        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
