import React, { useState } from 'react';
import { Alert, Form, Button, Row, Col } from 'react-bootstrap';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://localhost:7148/api/auth';

export default function RegisterForm({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
       const response = await fetch(`${API_BASE_URL}/register/customer`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
          },
         body: JSON.stringify(formData)
       });

      const data = await response.json();

      if (!response.ok) {
         let errorMessage = data.message || data.title || `Registration failed: ${response.status}`;
         if (response.status === 400 && data.errors) {
            errorMessage = Object.values(data.errors).flat().join('. ');
         }
         throw new Error(errorMessage);
       }

       if (data.token) {
        Cookies.set('authToken', data.token, { expires: 7, secure: true, sameSite: 'strict' });
        setIsAuthenticated(true);
       } else {
          setSuccessMessage("Registration successful! Please login.");
          setFormData({ firstName: '', lastName: '', email: '', password: '', phone: '' });
        }

     } catch (err) {
      console.error('Registration fetch error:', err);
      setError(err.message || 'An unexpected error occurred during registration.');
     } finally {
        setSubmitting(false);
     }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Row className="mb-3">
        <Form.Group as={Col} controlId="registerFirstName">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            disabled={submitting}
          />
        </Form.Group>
        <Form.Group as={Col} controlId="registerLastName">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            disabled={submitting}
          />
        </Form.Group>
      </Row>
      <Form.Group className="mb-3" controlId="registerEmail">
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
      <Form.Group className="mb-3" controlId="registerPassword">
         <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          minLength={6}
          disabled={submitting}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="registerPhone">
        <Form.Label>Phone</Form.Label>
        <Form.Control
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          required
          disabled={submitting}
        />
      </Form.Group>
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Registering...' : 'Register'}
      </Button>
    </Form>
  );
}