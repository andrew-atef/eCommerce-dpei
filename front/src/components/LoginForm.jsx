import React, { useState } from 'react';
import { Alert, Form, Button } from 'react-bootstrap';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://localhost:7148/api/auth';

export default function LoginForm({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
         let errorMessage = data.message || data.title || `Login failed: ${response.status}`;
         if (response.status === 400 && data.errors) {
           errorMessage = Object.values(data.errors).flat().join('. ');
         }
         throw new Error(errorMessage);
      }

      if (data.token) {
        Cookies.set('authToken', data.token, { expires: 7, secure: true, sameSite: 'strict' });
        setIsAuthenticated(true);
      } else {
         throw new Error("Login successful, but no token received.");
      }

    } catch (err) {
      console.error('Login fetch error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-3" controlId="loginEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={submitting}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="loginPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          disabled={submitting}
        />
      </Form.Group>
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Logging in...' : 'Login'}
      </Button>
    </Form>
  );
}