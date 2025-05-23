import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { UserContext } from '../UserContext';
import '../styles/theme.css';

const awsconfig = {
  Auth: {
    region: 'eu-north-1',
    userPoolId: 'eu-north-1_9V34i4Lht',
    userPoolWebClientId: '186abjvi5krvchetqsftmno8ol',
    userPoolClientSecret: '1sung7jnosv3sp12bilgtl5m4c3dbve0ga3b4gbisl2m2bfogt39', // Replace with actual secret
  },
};

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const generateSecretHash = (username, clientId, clientSecret) => {
    if (!username || !clientId || !clientSecret) {
      throw new Error('Missing required parameters for SECRET_HASH');
    }
    const message = username + clientId;
    console.log('Generating SECRET_HASH with:', { message, clientSecret: clientSecret.slice(0, 4) + '...' });
    const hash = CryptoJS.HmacSHA256(message, clientSecret);
    return CryptoJS.enc.Base64.stringify(hash);
  };

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

  const handleLogin = async () => {
    const { userPoolWebClientId, userPoolClientSecret, region } = awsconfig.Auth;
    if (!userPoolWebClientId || !userPoolClientSecret || !region) {
      setMessage('Configuration error: Missing Auth parameters');
      console.error('Missing Auth config:', { userPoolWebClientId, userPoolClientSecret, region });
      return;
    }

    if (!form.username || !form.password) {
      setMessage('Please enter both username and password');
      return;
    }

    try {
      // Clear existing storage
      localStorage.clear();
      console.log('Cleared localStorage before login');

      // Test localStorage access
      try {
        localStorage.setItem('testKey', 'testValue');
        if (localStorage.getItem('testKey') !== 'testValue') {
          throw new Error('localStorage write failed');
        }
        localStorage.removeItem('testKey');
        console.log('localStorage test passed');
      } catch (storageTestError) {
        console.error('localStorage test failed:', storageTestError);
        setMessage('Browser storage is restricted. Check privacy settings or extensions.');
        return;
      }

      const secretHash = generateSecretHash(form.username, userPoolWebClientId, userPoolClientSecret);

      const payload = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: userPoolWebClientId,
        AuthParameters: {
          USERNAME: form.username,
          PASSWORD: form.password,
          SECRET_HASH: secretHash,
        },
      };

      console.log('InitiateAuth payload:', {
        AuthFlow: payload.AuthFlow,
        ClientId: payload.ClientId,
        AuthParameters: { USERNAME: payload.AuthParameters.USERNAME, SECRET_HASH: payload.AuthParameters.SECRET_HASH.slice(0, 4) + '...' }
      });

      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('InitiateAuth error:', errorData);
        setMessage(errorData.message || 'Login failed');
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('InitiateAuth response:', data);

      if (data.AuthenticationResult) {
        const { IdToken, AccessToken, RefreshToken, ExpiresIn } = data.AuthenticationResult;

        const tokenPayload = decodeJwt(IdToken);
        console.log('IdToken payload:', tokenPayload);
        console.log('IdToken:', IdToken?.slice(0, 10), 'Length:', IdToken?.length);

        if (!tokenPayload.sub) {
          console.error('Missing sub in IdToken payload');
          setMessage('Invalid token: Missing user ID');
          return;
        }

        const prefix = `CognitoIdentityServiceProvider.${userPoolWebClientId}`;
        const username = form.username.toLowerCase();
        const expiresAt = Date.now() + (ExpiresIn || 3600) * 1000;

        try {
          console.log('Writing to localStorage...');
          const storageItems = [
            { key: `${prefix}.${username}.idToken`, value: IdToken, name: 'idToken' },
            { key: `${prefix}.${username}.accessToken`, value: AccessToken, name: 'accessToken' },
            { key: `${prefix}.${username}.refreshToken`, value: RefreshToken, name: 'refreshToken' },
            { key: `${prefix}.${username}.tokenExpiration`, value: expiresAt.toString(), name: 'tokenExpiration' },
            { key: `${prefix}.LastAuthUser`, value: username, name: 'LastAuthUser' },
            { key: `${prefix}.sub`, value: tokenPayload.sub, name: 'sub' },
          ];

          for (const item of storageItems) {
            console.log(`Writing ${item.name} to ${item.key}`);
            localStorage.setItem(item.key, item.value);
            const storedValue = localStorage.getItem(item.key);
            if (storedValue !== item.value) {
              throw new Error(`Failed to verify ${item.name} write: expected ${item.value}, got ${storedValue}`);
            }
            console.log(`${item.name} written successfully`);
          }

          console.log('Stored localStorage keys:', Object.keys(localStorage).filter(key => key.startsWith(prefix)));

          setUser({ username, sub: tokenPayload.sub });
          setMessage('Login successful');
          navigate('/dashboard');
        } catch (storageError) {
          console.error('Storage error:', storageError, storageError.stack);
          setMessage(`Failed to store session data: ${storageError.message}. Check browser storage settings.`);
          return;
        }
      } else if (data.__type === 'UserNotConfirmedException') {
        setMessage('User not confirmed. Please verify your email before logging in.');
      } else {
        console.error('No AuthenticationResult in response:', data);
        setMessage(data.message || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Login error:', err, err.stack);
      setMessage(err.message || 'Failed to log in. Please try again.');
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form className="auth-form">
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <button type="button" className="button-primary" onClick={handleLogin}>
          Log In
        </button>
        {message && <p className="error-message">{message}</p>}
      </form>
      <p>
        Don’t have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
};

export default Login;