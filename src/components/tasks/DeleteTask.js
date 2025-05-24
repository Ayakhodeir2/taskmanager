import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../global.css';
import '../../styles/theme.css';

const awsconfig = {
  Auth: {
    region: 'eu-north-1',
    userPoolId: 'eu-north-1_9V34i4Lht',
    userPoolWebClientId: '186abjvi5krvchetqsftmno8ol',
    userPoolClientSecret: '1sung7jnosv3sp12bilgtl5m4c3dbve0ga3b4gbisl2m2bfogt39',
  },
};

const DeleteTask = () => {
  const [taskId, setTaskId] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
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
      setMessage('Please sign in to delete tasks.');
      navigate('/login');
      return null;
    }

    const idToken = localStorage.getItem(`${prefix}.${username}.idToken`);
    const tokenExpiration = localStorage.getItem(`${prefix}.${username}.tokenExpiration`);
    console.log('Stored tokens:', { idToken: idToken?.slice(0, 10), tokenExpiration });

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

  const deleteTask = async () => {
    if (!taskId) {
      setMessage('Please enter a task ID.');
      return;
    }

    try {
      setMessage('Deleting task...');

      const authData = await checkUser();
      if (!authData) {
        setMessage('Error: Authentication failed. Please sign in again.');
        setIsAuthenticated(false);
        return;
      }

      const { idToken } = authData;
      console.log('Using idToken:', idToken.slice(0, 10));

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      };

      console.log(`Sending DELETE request to: https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks/${taskId}`);
      const response = await fetch(`https://cl51yhgxi8.execute-api.eu-north-1.amazonaws.com/prod/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.message || `Failed to delete task: ${response.status}`);
      }

      const data = await response.json();
      console.log('Task deleted:', data);
      setMessage('Task deleted: ' + JSON.stringify(data));
    } catch (err) {
      console.error('Delete task error:', err, err.stack);
      const errorMessage = err?.message || JSON.stringify(err) || 'Unknown error';
      setMessage('Error deleting task: ' + errorMessage);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

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