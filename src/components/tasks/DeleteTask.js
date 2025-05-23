import React, { useState } from 'react';
import '../../global.css';
import '../../styles/theme.css';
const DeleteTask = () => {
  const [taskId, setTaskId] = useState('');
  const [message, setMessage] = useState('');

  const deleteTask = async () => {
    if (!taskId) {
      setMessage('Please enter a task ID.');
      return;
    }

    try {
      const response = await fetch(`https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/${taskId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      setMessage('Task deleted: ' + JSON.stringify(data));
    } catch (err) {
      setMessage('Error deleting task: ' + err.message);
    }
  };

  return (
    <div className="container">
      <h2>Delete Task</h2>
      <input
        className="input-primary"
        placeholder="Enter Task ID"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />
      <button className="button-primary" onClick={deleteTask}>Delete</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default DeleteTask;
