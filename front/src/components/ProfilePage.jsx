import React, { useEffect, useState } from 'react';
import { Container, Card, Alert, Spinner, Row, Col, Image } from 'react-bootstrap'; // Added Image
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://localhost:7148/api/auth'; // Ensure this is correct

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Placeholder avatar URL
  const placeholderAvatarUrl = `https://placehold.co/150x150/EFEFEF/AAAAAA&text=${profile ? profile.firstName?.charAt(0) || 'P' : 'P'}`;


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const token = Cookies.get('authToken');
      if (!token) {
          setError("Authentication token not found. Please login.");
          setLoading(false);
          return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Check if response is OK before trying to parse as JSON
        if (!response.ok) {
            let errorMessage = `Failed to fetch profile: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.title || errorMessage;
            } catch (e) {
                // If parsing error JSON fails, use the status text
                errorMessage = `Failed to fetch profile: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const profileData = await response.json();
        setProfile(profileData);

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'An unexpected error occurred while fetching your profile.');
      } finally {
         setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
     return (
       <Container className="text-center my-5">
         <Spinner animation="border" role="status">
           <span className="visually-hidden">Loading Profile...</span>
         </Spinner>
       </Container>
     );
   }

  return (
    <Container className="my-4">
      <h2 className="mb-4">My Profile</h2>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {profile && !error && (
        <Card className="mt-3 shadow-sm">
          <Card.Body>
            <Row className="align-items-center">
              <Col xs="auto">
                <Image 
                  src={placeholderAvatarUrl} 
                  roundedCircle 
                  style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid #dee2e6' }}
                  alt="Profile Avatar"
                />
              </Col>
              <Col>
                <Card.Title className="mb-1 h4">
                  Welcome, {profile.firstName || ''} {profile.lastName || ''}
                </Card.Title>
                <Card.Text className="text-muted mb-2">
                  {profile.email}
                </Card.Text>
                <hr />
                <Row>
                  <Col md={6}>
                    <strong>First Name:</strong> {profile.firstName || 'N/A'}
                  </Col>
                  <Col md={6}>
                    <strong>Last Name:</strong> {profile.lastName || 'N/A'}
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}>
                    <strong>Email:</strong> {profile.email}
                  </Col>
                  <Col md={6}>
                    <strong>Phone:</strong> {profile.phone || 'N/A'}
                  </Col>
                </Row>
                {/* Add more profile details here if available and needed */}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
       {!profile && !loading && !error && (
         <Alert variant="info" className="mt-3">No profile data found or you might be logged out. Please try logging in again.</Alert>
       )}
    </Container>
  );
}