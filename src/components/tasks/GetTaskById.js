import React, { useState } from 'react';
import '../../styles/theme.css';
import '../../global.css';

const GetTaskById = () => {
  const [taskId, setTaskId] = useState('');
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  const getAuthToken = () => {
    const lastUserKey = 'CognitoIdentityServiceProvider.186abjvi5krvchetqsftmno8ol.LastAuthUser';
    const lastUser = localStorage.getItem(lastUserKey);

    if (!lastUser) {
      return null;
    }

    const clientId = '186abjvi5krvchetqsftmno8ol';
    const tokenKey = `CognitoIdentityServiceProvider.${clientId}.${lastUser}.idToken`;
    const accessTokenKey = `CognitoIdentityServiceProvider.${clientId}.${lastUser}.accessToken`;

    return localStorage.getItem(tokenKey) || localStorage.getItem(accessTokenKey);
  };

  const checkTokenExpiration = () => {
    const clientId = '186abjvi5krvchetqsftmno8ol';
    const lastUserKey = `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`;
    const lastUser = localStorage.getItem(lastUserKey);

    if (!lastUser) return true;

    const expKey = `CognitoIdentityServiceProvider.${clientId}.${lastUser}.tokenExpiration`;
    const expiration = localStorage.getItem(expKey);

    return expiration && new Date().getTime() > parseInt(expiration) * 1000;
  };

  const fetchTask = async () => {
    try {
      if (checkTokenExpiration()) {
        throw new Error('Session expired. Please login again');
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login first');
      }

      const response = await fetch(
        `https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks/${taskId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.error !== undefined) {
        setError(data.error);
        return;
      }
      setTask(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Task not found or error fetching task.');
      setTask(null);
    }
  };

  return (
    <div className="container">
      <h2>Get Task By ID</h2>
      <input
        className="input-primary"
        placeholder="Enter Task ID"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />
      <button className="button-primary" onClick={fetchTask}>
        Fetch Task
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {task && (
        <div
          className="task-card"
          style={{
            marginTop: '20px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Task Details</h3>

          <div style={{ marginBottom: '10px' }}>
            <strong>Task ID:</strong> {task.TaskID || 'Not available'}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Description:</strong> {task.description || 'None'}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Status:</strong>
            <span
              style={{
                color: task.status === 'pending' ? '#d4a017' : '#28a745',
                fontWeight: 'bold',
                marginLeft: '5px',
              }}
            >
              {task.status || 'Not specified'}
            </span>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Priority:</strong> {task.priority || 'Not specified'}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Due Date:</strong> {task.due_date || 'Not specified'}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Created At:</strong> {task.created_at || 'Not specified'}
          </div>

          {task.attachments && task.attachments.length > 0 && (
            <div>
              <strong>Attachments:</strong>
              <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                {task.attachments.map((attachment, index) => (
                  <li key={index}>{attachment.file_name || 'Unnamed'}</li>
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