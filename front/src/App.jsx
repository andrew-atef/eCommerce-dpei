import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Your global App.css
import { Navbar, Nav, Container, Spinner, Row, Col, Button } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css';


import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AuthTabs from './components/AuthTabs';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import OrderDetailPage from './components/OrderDetailPage';
import AdminLayout, { AdminDashboard } from './components/AdminLayout';
import AdminCategoryForm from './components/AdminCategoryForm';
import AdminProductForm from './components/AdminProductForm';
import AdminProductEditPage from './components/AdminProductEditPage';
import AdminOrderManagement from './components/AdminOrderManagement';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { isAdmin as checkIsAdminRole } from './utils/auth';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    const token = Cookies.get('authToken');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    if (authenticated) {
        setUserIsAdmin(checkIsAdminRole());
    } else {
        setUserIsAdmin(false);
    }
    setLoadingAuth(false);

    // Listen for custom authChange event (e.g., after logout)
    const handleAuthChange = () => {
      const currentToken = Cookies.get('authToken');
      const currentAuthStatus = !!currentToken;
      setIsAuthenticated(currentAuthStatus);
      setUserIsAdmin(currentAuthStatus ? checkIsAdminRole() : false);
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setUserIsAdmin(checkIsAdminRole());
    window.dispatchEvent(new CustomEvent('authChange')); // Notify about auth change
  };

  const handleLogout = () => {
    Cookies.remove('authToken');
    setIsAuthenticated(false);
    setUserIsAdmin(false);
    window.dispatchEvent(new CustomEvent('authChange')); // Notify about auth change
  };

  if (loadingAuth) {
      return (
        <div className="vh-100 d-flex justify-content-center align-items-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading Application...</span>
            </Spinner>
        </div>
      );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage onAuthSuccess={handleAuthSuccess} />
            ) : (
              <Navigate to={userIsAdmin ? "/admin" : "/"} replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <RegisterPage onAuthSuccess={handleAuthSuccess} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<AuthenticatedLayout onLogout={handleLogout} userIsAdmin={userIsAdmin} />}>
            <Route index path="/" element={<HomePage />} />
            
            {!userIsAdmin && (
              <>
                <Route path="/cart" element={<CartPageWrapper />} />
                <Route path="/checkout" element={<CheckoutPageWrapper />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              </>
            )}
            <Route path="/profile" element={<ProfilePage />} />


            <Route element={<AdminProtectedRoute />}> {/* Ensures only admins can access admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="categories/new" element={<AdminCategoryForm />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/edit/:productId" element={<AdminProductEditPage />} />
                <Route path="orders" element={<AdminOrderManagement />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} /> {/* Catch-all for authenticated users */}
          </Route>
        </Route>

        {/* General catch-all, redirects to login if not authenticated, or home/admin if authenticated */}
        <Route path="*" element={ <Navigate to={isAuthenticated ? (userIsAdmin ? "/admin" : "/") : "/login"} replace /> } />
      </Routes>
    </>
  );
}

function LoginPage({ onAuthSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/"; // Default to home if no 'from'

    const handleLoginSuccess = () => {
        onAuthSuccess();
        // Navigate to 'from' location or admin/home based on role
        const isAdminUser = checkIsAdminRole();
        navigate(isAdminUser ? "/admin" : from, { replace: true });
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={5} xl={4}>
                    <AuthTabs isLogin={true} setIsLogin={() => navigate('/register', { state: location.state })}>
                        <LoginForm setIsAuthenticated={handleLoginSuccess} />
                    </AuthTabs>
                </Col>
            </Row>
        </Container>
    );
}

function RegisterPage({ onAuthSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleRegisterSuccess = () => {
        onAuthSuccess();
        // After registration, typically navigate to login or directly home if auto-login
        navigate('/login', { replace: true, state: { from: { pathname: '/' } } }); // Or navigate to home if auto-login
    };


    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={5} xl={4}>
                    <AuthTabs isLogin={false} setIsLogin={() => navigate('/login', { state: location.state })}>
                        <RegisterForm setIsAuthenticated={handleRegisterSuccess} />
                    </AuthTabs>
                </Col>
            </Row>
        </Container>
    );
}

function AuthenticatedLayout({ onLogout, userIsAdmin }) {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        onLogout();
        navigate('/login', { replace: true });
    }

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 sticky-top shadow-sm">
                <Container>
                    <Navbar.Brand as={Link} to={userIsAdmin ? "/admin" : "/"}>EasyMart</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to={userIsAdmin ? "/admin" : "/"} active={location.pathname === (userIsAdmin ? "/admin" : "/")}>
                                {userIsAdmin ? "Dashboard" : "Home"}
                            </Nav.Link>
                            {!userIsAdmin && (
                                <Nav.Link as={Link} to="/orders" active={location.pathname.startsWith('/orders')}>My Orders</Nav.Link>
                            )}
                            {userIsAdmin && (
                                <>
                                  {/* Admin specific links can go here or in AdminLayout */}
                                  {/* Example: <Nav.Link as={Link} to="/admin/products/new">Create Product</Nav.Link> */}
                                </>
                            )}
                        </Nav>
                        <Nav>
                            {!userIsAdmin && (
                                <Nav.Link as={Link} to="/cart" active={location.pathname === '/cart'}>
                                    <i className="fas fa-shopping-cart"></i> Cart
                                </Nav.Link>
                            )}
                            <Nav.Link as={Link} to="/profile" active={location.pathname === '/profile'}>
                                <i className="fas fa-user"></i> Profile
                            </Nav.Link>
                            <Nav.Link onClick={handleLogoutClick} style={{ cursor: 'pointer' }}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <div className="container-fluid App-content"> {/* Added class for potential global content styling */}
                 <Outlet />
            </div>
        </>
    );
}

function ProtectedRoute({ isAuthenticated }) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}


function CartPageWrapper() {
    const navigate = useNavigate();
    return <CartPage navigateToCheckout={() => navigate('/checkout')} />;
}

function CheckoutPageWrapper() {
    const navigate = useNavigate();
    return <CheckoutPage navigate={navigate} />;
}

function NotFound() {
    return (
        <Container className="text-center my-5 py-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <h1 className="display-1">404</h1>
                    <h2>Page Not Found</h2>
                    <p className="lead">
                        Sorry, the page you are looking for does not exist or has been moved.
                    </p>
                    <Button as={Link} to="/" variant="primary" size="lg" className="mt-3">
                        Go to Homepage
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default App;