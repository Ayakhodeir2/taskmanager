import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import awsconfig from '../aws-exports';
import CryptoJS from 'crypto-js';
import '../styles/theme.css';

const Signup = () => {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const generateSecretHash = (username, clientId, clientSecret) => {
    const message = username + clientId;
    const hash = CryptoJS.HmacSHA256(message, clientSecret);
    return CryptoJS.enc.Base64.stringify(hash);
  };

  const handleSignup = async () => {
    const { userPoolWebClientId, userPoolClientSecret, region } = awsconfig.Auth;
    const secretHash = generateSecretHash(form.username, userPoolWebClientId, userPoolClientSecret);

    const payload = {
      ClientId: userPoolWebClientId,
      Username: form.username,
      Password: form.password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: 'email',
          Value: form.email,
        },
      ],
    };

    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.UserSub) {
        alert('Signup successful! Please check your email and confirm your account.');
        navigate('/Confirm');
      } else {
        setMessage(data.message || JSON.stringify(data));
      }
    } catch (err) {
      setMessage(err.message || JSON.stringify(err));
    }
  };

  return (
    <div className="container">
      <h2>Sign Up</h2>
      <form className="auth-form">
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <button type="button" className="button-primary" onClick={handleSignup}>
          Sign Up
        </button>
        {message && <p className="error-message">{message}</p>}
      </form>
      <p>
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </div>
  );
};

export default Signup;
