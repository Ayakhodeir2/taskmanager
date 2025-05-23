import React, { useState } from 'react';
import '../../styles/theme.css';
import '../../global.css';

const UpdateTask = () => {
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [files, setFiles] = useState([]); // selected files
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const updateTask = async () => {
    try {
      // Prepare payload with optional fields only if provided
      const payload = {
        title,
        description,
        status,
      };
      if (dueDate) payload.due_date = dueDate;
      if (priority) payload.priority = priority;

      // Add attachments file names if any
      if (files.length > 0) {
        payload.attachments = files.map((file) => ({ file_name: file.name }));
      }

      const response = await fetch(`https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();
      setMessage('Task updated. Uploading files if any...');

      // Upload files using presigned URLs if any
      if (data.presigned_uploads && data.presigned_uploads.length > 0) {
        await Promise.all(
          data.presigned_uploads.map(({ file_name, upload_url }) => {
            const file = files.find((f) => f.name === file_name);
            return fetch(upload_url, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type },
            });
          })
        );
        setMessage('Task updated and files uploaded successfully.');
      } else {
        setMessage('Task updated successfully.');
      }
    } catch (err) {
      setMessage('Error updating task: ' + err.message);
    }
  };

  return (
    <div className="container">
      <h2>Update Task</h2>

      <input
        className="input-primary"
        placeholder="Task ID"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />

      <input
        className="input-primary"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="input-primary"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select className="input-primary" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Select Status</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <input
        type="date"
        className="input-primary"
        placeholder="Due Date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <input
        className="input-primary"
        placeholder="Priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      />

      <input type="file" multiple onChange={handleFileChange} />

      <button className="button-primary" onClick={updateTask}>Update</button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default UpdateTask;
