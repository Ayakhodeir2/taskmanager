import React, { useState, useEffect } from 'react';
import '../../styles/theme.css';
import '../../global.css';

const GetTaskById = () => {
  const [taskId, setTaskId] = useState('');
  const [task, setTask] = useState(null);
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchTask = async () => {
    setLoading(true);
    setError(null);
    try {
      if (checkTokenExpiration()) {
        throw new Error('Session expired. Please login again');
      }

      const token = getAuthToken();
      console.log('Token used:', token);
      if (!token) {
        throw new Error('Please login first');
      }

      if (!taskId) {
        throw new Error('Please enter a task ID');
      }

      const response = await fetch(
        `https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks/${taskId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTask(data);
    } catch (err) {
      console.log('Error is: ', err);
      console.error('Error fetching task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Get Task By ID</h2>
      <input
        type="text"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
        placeholder="Enter Task ID (e.g., 013c850b-573c-4ee2-ac3b-9460354fd146)"
        style={{
          padding: '10px',
          marginBottom: '15px',
          width: '300px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '16px',
        }}
      />
      <button
        className="button-primary"
        onClick={fetchTask}
        disabled={loading}
        style={{
          padding: '10px 20px',
          marginRight: '10px',
        }}
      >
        {loading ? 'Loading...' : 'Fetch Task'}
      </button>
      <button
        className="button-secondary"
        onClick={() => {
          setTaskId('');
          setTask(null);
          setError(null);
        }}
        style={{
          padding: '10px 20px',
        }}
      >
        Clear
      </button>
      <button
        className="button-tertiary"
        onClick={() => {
          // Add sign-out logic here (e.g., clear localStorage and redirect)
          console.log('Sign Out clicked');
        }}
        style={{
          padding: '10px 20px',
          marginTop: '10px',
        }}
      >
        Sign Out
      </button>
      <button
        className="button-tertiary"
        onClick={() => {
          // Add authentication check logic here
          console.log('Check Authentication clicked');
        }}
        style={{
          padding: '10px 20px',
          marginTop: '10px',
        }}
      >
        Check Authentication
      </button>

      {error && <p className="error-message" style={{ color: '#dc3545', marginTop: '15px' }}>{error}</p>}

      {task && (
        <div
          className="task-card"
          style={{
            padding: '15px',
            marginTop: '20px',
            border: '1px solid #eee',
            borderRadius: '6px',
            backgroundColor: '#f9f9f9',
            maxWidth: '500px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>{task.title || 'Untitled Task'}</h3>
          <p><strong>ID:</strong> {task.TaskID}</p>
          <p><strong>Description:</strong> {task.description || 'No description'}</p>
          <p><strong>Status:</strong>
            <span
              style={{
                color: task.status === 'pending' ? '#d4a017' : '#28a745',
                fontWeight: 'bold',
                marginLeft: '5px',
              }}
            >
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
      )}
    </div>
  );
};

export default GetTaskById;