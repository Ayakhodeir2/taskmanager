import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../global.css';
import '../../styles/theme.css';

const awsconfig = {
  Auth: {
    region: 'eu-north-1',
    userPoolId: 'eu-north-1_9V34i4Lht',
    userPoolWebClientId: '186abjvi5krvchetqsftmno8ol',
    userPoolClientSecret: 'YOUR_CLIENT_SECRET', // Replace with actual secret
  },
};

const CreateTask = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState({});
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

  const validateDueDate = (dateStr) => {
    if (!dateStr) return true; // Optional field
    try {
      const inputDate = new Date(dateStr);
      const now = new Date();
      if (inputDate <= now) {
        return false; // Must be in the future
      }
      return true;
    } catch (e) {
      console.error('Invalid due_date format:', e);
      return false;
    }
  };

  const checkUser = async () => {
    const prefix = `CognitoIdentityServiceProvider.${awsconfig.Auth.userPoolWebClientId}`;
    const sub = localStorage.getItem(`${prefix}.sub`);
    const username = localStorage.getItem(`${prefix}.LastAuthUser`);
    console.log('checkUser started for sub:', sub, 'username:', username);

    if (!sub || !username) {
      console.warn('Missing sub or LastAuthUser in localStorage');
      setIsAuthenticated(false);
      setMessage('Please sign in to create tasks.');
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

  const createTask = async () => {
    if (!title || !description) {
      setMessage('Title and Description are required');
      return;
    }

    if (dueDate && !validateDueDate(dueDate)) {
      setMessage('Due date must be in the future');
      return;
    }

    try {
      setMessage('Creating task...');

      const authData = await checkUser();
      if (!authData) {
        setMessage('Error: Authentication failed. Please sign in again.');
        setIsAuthenticated(false);
        return;
      }

      const { idToken } = authData;
      console.log('Using idToken:', idToken?.slice(0, 10));

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      };

      const payload = {
        title,
        description,
        due_date: dueDate || undefined,
        priority: priority.toLowerCase(),
        attachments: files.map(f => ({ file_name: f.name })),
      };

      console.log('Task payload:', payload);
      const response = await fetch('https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.message || `Failed to create task: ${response.status}`);
      }

      const data = await response.json();
      console.log('Task created:', data);
      setMessage(`Task created with ID: ${data.task_id}`);

      const presignedAttachments = data.attachments || [];
      const statusUpdates = {};

      for (const att of presignedAttachments) {
        const file = files.find(f => f.name === att.file_name);
        if (!file) continue;

        statusUpdates[file.name] = 'uploading';
        setUploadStatus({ ...statusUpdates });

        try {
          const uploadResponse = await fetch(att.upload_url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          });
          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
          }
          statusUpdates[file.name] = 'done';
        } catch (uploadErr) {
          statusUpdates[file.name] = 'error';
          console.error('Upload error for', file.name, uploadErr);
        }
        setUploadStatus({ ...statusUpdates });
      }
    } catch (err) {
      console.error('Create task error:', err, err.stack);
      const errorMessage = err?.message || JSON.stringify(err) || 'Unknown error';
      setMessage('Error creating task: ' + errorMessage);
      setUploadStatus({});
    }
  };

  const handleSignOut = async () => {
    try {
      const prefix = `CognitoIdentityServiceProvider.${awsconfig.Auth.userPoolWebClientId}`;
      localStorage.removeItem(`${prefix}.sub`);
      localStorage.removeItem(`${prefix}.LastAuthUser`);
      localStorage.removeItem(`${prefix}.ayakhodeir2@gmail.com.idToken`);
      localStorage.removeItem(`${prefix}.ayakhodeir2@gmail.com.accessToken`);
      localStorage.removeItem(`${prefix}.ayakhodeir2@gmail.com.refreshToken`);
      localStorage.removeItem(`${prefix}.ayakhodeir2@gmail.com.tokenExpiration`);
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
      <h2>Create Task</h2>
      <input
        className="input-primary"
        placeholder="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="input-primary"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="input-primary"
        type="date"
        placeholder="Due Date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <select
        className="input-primary"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="low">Low Priority</option>
        <option value="normal">Normal Priority</option>
        <option value="high">High Priority</option>
      </select>

      <div>
        <h4>Attachments</h4>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="input-primary"
        />
        {files.length > 0 && (
          <ul>
            {files.map(file => (
              <li key={file.name}>
                {file.name} - {uploadStatus[file.name] || 'pending'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="button-primary" onClick={createTask}>
        Create
      </button>
      <button className="button-primary" onClick={handleSignOut}>
        Sign Out
      </button>
      <button className="button-primary" onClick={checkUser}>
        Check Authentication
      </button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateTask;