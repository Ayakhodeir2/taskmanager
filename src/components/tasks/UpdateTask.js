import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/theme.css';
import '../../global.css';

const awsconfig = {
  Auth: {
    region: 'eu-north-1',
    userPoolId: 'eu-north-1_9V34i4Lht',
    userPoolWebClientId: '186abjvi5krvchetqsftmno8ol',
    userPoolClientSecret: '1sung7jnosv3sp12bilgtl5m4c3dbve0ga3b4gbisl2m2bfogt39',
  },
};

const UpdateTask = () => {
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('JWT decode error:', e);
      return {};
    }
  };

  const checkUser = async () => {
    const prefix = `CognitoIdentityServiceProvider.${awsconfig.Auth.userPoolWebClientId}`;
    const sub = localStorage.getItem(`${prefix}.sub`);
    const username = localStorage.getItem(`${prefix}.LastAuthUser`) || 'ayakhodeir2@gmail.com';
    console.log('checkUser started for sub:', sub, 'username:', username);

    if (!sub || !username) {
      console.warn('Missing sub or LastAuthUser in localStorage');
      setIsAuthenticated(false);
      setMessage('Please sign in to update tasks.');
      navigate('/login');
      return null;
    }

    const idToken = localStorage.getItem(`${prefix}.${username}.idToken`);
    const tokenExpiration = localStorage.getItem(`${prefix}.${username}.tokenExpiration`);
    console.log('Stored tokens:', {
      idToken: idToken?.slice(0, 10),
      tokenExpiration,
    });

    if (!idToken) {
      console.warn('No idToken in localStorage');
      setIsAuthenticated(false);
      setMessage('Please sign in again. Missing authentication token.');
      navigate('/login');
      return null;
    }

    const expirationTime = parseInt(tokenExpiration, 10);
    const idTokenPayload = decodeJwt(idToken);
    console.log('Stored IdToken payload:', idTokenPayload);

    if (expirationTime < Date.now() || (idTokenPayload.exp * 1000) < Date.now()) {
      console.warn('idToken expired');
      setIsAuthenticated(false);
      setMessage('Session expired. Please sign in again.');
      navigate('/login');
      return null;
    }

    console.log('User validated with sub:', sub, 'and idToken:', idToken.slice(0, 10));
    setIsAuthenticated(true);
    setMessage('User is authenticated');

    return { sub, idToken };
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const updateTask = async () => {
    try {
      const authData = await checkUser();
      if (!authData) {
        setMessage('Error: Authentication failed. Please sign in again.');
        return;
      }

      const { idToken } = authData;
      console.log('Using idToken:', idToken?.slice(0, 10));

      if (!taskId) {
        setMessage('Error: Task ID is required.');
        return;
      }

      const payload = {};
      if (title) payload.title = title;
      if (description) payload.description = description;
      if (status) payload.status = status;
      if (dueDate) {
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
          setMessage('Error: Invalid due date.');
          return;
        }
        payload.due_date = dueDateObj.toISOString().split('T')[0];
      }
      if (priority && ['low', 'normal', 'high'].includes(priority.toLowerCase())) {
        payload.priority = priority.toLowerCase();
      }
      if (files.length > 0) {
        payload.attachments = files.map((file) => ({ file_name: file.name }));
      }

      // Ensure at least one field is provided for the update
      if (Object.keys(payload).length === 0) {
        setMessage('Error: At least one field (title, description, status, due date, priority, or attachments) must be provided.');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      };

      const body = JSON.stringify(payload);
      console.log('Sending PUT request with body:', body);
      const response = await fetch(`https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.message || `Failed to update task: ${response.status}`);
      }

      const data = await response.json();
      setMessage('Task updated. Uploading files if any...');

      if (data.presigned_uploads && data.presigned_uploads.length > 0) {
        await Promise.all(
          data.presigned_uploads.map(({ file_name, upload_url }) => {
            const file = files.find((f) => f.name === file_name);
            if (!file) {
              throw new Error(`File ${file_name} not found for upload`);
            }
            const contentType = file_name.toLowerCase().endsWith('.png') ? 'image/png' :
                              file_name.toLowerCase().endsWith('.jpg') || file_name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                              file_name.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                              file_name.toLowerCase().endsWith('.tex') ? 'text/x-tex' :
                              file.type || 'application/octet-stream';
            console.log(`Uploading ${file_name} with Content-Type: ${contentType}`);
            return fetch(upload_url, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': contentType },
            });
          })
        );
        setMessage('Task updated and files uploaded successfully.');
      } else {
        setMessage('Task updated successfully.');
      }
    } catch (err) {
      console.error('Update task error:', err, err.stack);
      const errorMessage = err?.message || JSON.stringify(err) || 'Unknown error';
      setMessage('Error updating task: ' + errorMessage);
    }
  };

  const handleSignOut = async () => {
    try {
      const prefix = `CognitoIdentityServiceProvider.${awsconfig.Auth.userPoolWebClientId}`;
      const username = localStorage.getItem(`${prefix}.LastAuthUser`) || 'ayakhodeir2@gmail.com';
      localStorage.removeItem(`${prefix}.sub`);
      localStorage.removeItem(`${prefix}.LastAuthUser`);
      localStorage.removeItem(`${prefix}.${username}.idToken`);
      localStorage.removeItem(`${prefix}.${username}.accessToken`);
      localStorage.removeItem(`${prefix}.${username}.refreshToken`);
      localStorage.removeItem(`${prefix}.${username}.tokenExpiration`);
      setIsAuthenticated(false);
      setMessage('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setMessage('Error signing out');
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
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="input-primary"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select className="input-primary" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Select Status (optional)</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <input
        type="date"
        className="input-primary"
        placeholder="Due Date (optional)"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <input
        className="input-primary"
        placeholder="Priority (optional: low, normal, high)"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      />

      <input type="file" multiple onChange={handleFileChange} />

      <button className="button-primary" onClick={updateTask}>Update</button>
      <button className="button-primary" onClick={handleSignOut}>Sign Out</button>
      <button className="button-primary" onClick={checkUser}>Check Authentication</button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default UpdateTask;