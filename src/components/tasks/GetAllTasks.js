import React, { useState, useEffect } from 'react';
import '../../styles/theme.css';
import '../../global.css';

const GetAllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    const lastUserKey = 'CognitoIdentityServiceProvider.186abjvi5krvchetqsftmno8ol.LastAuthUser';
    const lastUser = localStorage.getItem(lastUserKey);
    if (!lastUser) return null;

    const tokenKey = `CognitoIdentityServiceProvider.186abjvi5krvchetqsftmno8ol.${lastUser}.idToken`;
    return localStorage.getItem(tokenKey);
  };

  const checkTokenExpiration = () => {
    const clientId = '186abjvi5krvchetqsftmno8ol';
    const lastUserKey = `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`;
    const lastUser = localStorage.getItem(lastUserKey);
    if (!lastUser) return true;

    const expKey = `CognitoIdentityServiceProvider.${clientId}.${lastUser}.tokenExpiration`;
    const expiration = localStorage.getItem(expKey);
    return expiration && new Date().getTime() > parseInt(expiration);
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      if (checkTokenExpiration()) {
        throw new Error('Session expired. Please login again');
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login first');
      }

      const response = await fetch("https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Response: ", response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Ensure data is an array before setting it
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Error is: ", err);
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <h2>All Tasks</h2>
      <button
        className="button-primary"
        onClick={fetchTasks}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load All Tasks'}
      </button>

      {error && <p className="error-message">{error}</p>}

      <div className="tasks-container" style={{
        maxHeight: '500px',
        overflowY: 'auto',
        marginTop: '20px',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.TaskID} className="task-card" style={{
              padding: '15px',
              marginBottom: '15px',
              border: '1px solid #eee',
              borderRadius: '6px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3 style={{ marginTop: 0 }}>{task.title || 'Untitled Task'}</h3>
              <p><strong>ID:</strong> {task.TaskID}</p>
              <p><strong>Description:</strong> {task.description || 'No description'}</p>
              <p><strong>Status:</strong>
                <span style={{
                  color: task.status === 'pending' ? '#d4a017' : '#28a745',
                  fontWeight: 'bold',
                  marginLeft: '5px'
                }}>
                  {task.status}
                </span>
              </p>
              <p><strong>Created:</strong> {formatDate(task.created_at)}</p>
              <p><strong>Updated:</strong> {formatDate(task.updated_at)}</p>

              {task.attachments?.length > 0 && (
                <div>
                  <strong>Attachments:</strong>
                  <ul style={{ paddingLeft: '20px' }}>
                    {task.attachments.map((attachment, idx) => (
                      <li key={idx}>{attachment.file_name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          !loading && <p>No tasks found. Click "Load All Tasks" to fetch tasks.</p>
        )}
      </div>
    </div>
  );
};

export default GetAllTasks;