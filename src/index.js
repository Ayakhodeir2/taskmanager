import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './UserContext'; // Import your context provider
import './global.css';
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure({
  ...awsconfig,
  storage: localStorage, // Explicitly set storage
});



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider> {/* ✅ Wrap App inside this */}
      <App />
    </UserProvider>
  </React.StrictMode>
);
