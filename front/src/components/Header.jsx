import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUser, logout as authLogout, isAdmin as checkIsAdminRole } from '../utils/auth';
// If you have a cart context for item count, you might import it here
// import { useCart } from '../contexts/CartContext';

export default function Header() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // const { cartItemCount } = useCart(); // Example for cart item count

  const updateAuthState = () => {
    const user = getUser();
    setCurrentUser(user);
    setIsAdmin(checkIsAdminRole());
  };

  useEffect(() => {
    updateAuthState();

    // Listen for storage changes to update header if login/logout happens in another tab
    window.addEventListener('storage', updateAuthState);
    // Also listen for custom events if your login/logout logic dispatches them
    window.addEventListener('authChange', updateAuthState);

    return () => {
      window.removeEventListener('storage', updateAuthState);
      window.removeEventListener('authChange', updateAuthState);
    };
  }, []);

  const handleLogout = () => {
    authLogout();
    updateAuthState(); // Update state immediately
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect className="mb-3">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>E-Shop</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* Conditionally render Cart and My Orders links */}
            {!isAdmin && (
              <>
                <LinkContainer to="/cart">
                  <Nav.Link>
                    <i className="fas fa-shopping-cart"></i> Cart
                    {/* Example: {cartItemCount > 0 && <Badge pill bg="success" style={{ marginLeft: '5px' }}>{cartItemCount}</Badge>} */}
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/orders">
                  <Nav.Link>My Orders</Nav.Link>
                </LinkContainer>
              </>
            )}
            {currentUser ? (
              <NavDropdown title={currentUser.email || currentUser.name || 'User'} id="username-dropdown">
                {isAdmin && <LinkContainer to="/admin"><NavDropdown.Item>Admin Dashboard</NavDropdown.Item></LinkContainer>}
                {!isAdmin && <LinkContainer to="/profile"><NavDropdown.Item>Profile</NavDropdown.Item></LinkContainer>}
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <LinkContainer to="/login">
                <Nav.Link><i className="fas fa-user"></i> Login</Nav.Link>
              </LinkContainer>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}