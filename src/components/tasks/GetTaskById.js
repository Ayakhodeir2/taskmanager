import React, { useState } from 'react';
import '../../styles/theme.css';
import '../../global.css';

const GetTaskById = () => {
  const [taskId, setTaskId] = useState('');
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  const fetchTask = async () => {
    try {
      const response = await fetch(`https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/${taskId}`);
      const data = await response.json();

      setTask(data);
      setError('');
    } catch (err) {
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
      <button className="button-primary" onClick={fetchTask}>Fetch Task</button>

      {task && (
        <div>
          <h3>Task Details:</h3>
          <pre>{JSON.stringify(task, null, 2)}</pre>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default GetTaskById;
