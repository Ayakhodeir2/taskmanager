import React, { useState } from 'react';
import '../../styles/theme.css';
import '../../global.css';

const GetAllTasks = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks');
    }
  };

  return (
    <div className="container">
      <h2>All Tasks</h2>
      <button className="button-primary" onClick={fetchTasks}>Load All Tasks</button>
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>{JSON.stringify(task)}</li>
        ))}
      </ul>
    </div>
  );
};

export default GetAllTasks;
