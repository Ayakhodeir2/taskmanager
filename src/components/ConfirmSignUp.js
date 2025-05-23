import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import awsconfig from '../aws-exports';
import CryptoJS from 'crypto-js';
import '../styles/theme.css';
import '../global.css';

const ConfirmSignUp = () => {
  const [form, setForm] = useState({ username: '', code: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const generateSecretHash = (username, clientId, clientSecret) => {
    const message = username + clientId;
    const hash = CryptoJS.HmacSHA256(message, clientSecret);
    return CryptoJS.enc.Base64.stringify(hash);
  };

  const handleConfirm = async () => {
    const { userPoolWebClientId, userPoolClientSecret, region } = awsconfig.Auth;
    const secretHash = generateSecretHash(form.username, userPoolWebClientId, userPoolClientSecret);

    const payload = {
      ClientId: userPoolWebClientId,
      Username: form.username,
      ConfirmationCode: form.code,
      SecretHash: secretHash,
    };

    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.code) {
        alert('User confirmed! You can now log in.');
        navigate('/login');
      } else {
        setMessage(data.message || JSON.stringify(data));
      }
    } catch (err) {
      setMessage(err.message || JSON.stringify(err));
    }
  };

  return (
    <div className="container">
      <h2>Confirm Sign Up</h2>
      <input
        name="username"
        className="input-primary"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
      />
      <input
        name="code"
        className="input-primary"
        placeholder="Verification Code"
        value={form.code}
        onChange={handleChange}
      />
      <button className="button-primary" onClick={handleConfirm}>Confirm</button>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
};

export default ConfirmSignUp;
