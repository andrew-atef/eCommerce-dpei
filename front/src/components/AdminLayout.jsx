import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();

  return (
    <Container fluid>
      <Row>
        <Col md={3} lg={2} className="bg-light vh-100 p-3 border-end d-none d-md-block">
          <h4>Admin Menu</h4>
          <Nav className="flex-column" variant="pills">
            <Nav.Item>
               <Nav.Link as={Link} to="/admin" active={location.pathname === '/admin'} end>Dashboard</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/admin/categories/new" active={location.pathname === '/admin/categories/new'}>Create Category</Nav.Link>
            </Nav.Item>
             <Nav.Item>
              <Nav.Link as={Link} to="/admin/products/new" active={location.pathname === '/admin/products/new'}>Create Product</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link as={Link} to="/admin/orders" active={location.pathname === '/admin/orders'}>Manage Orders</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md={9} lg={10} className="p-4">
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}

export function AdminDashboard() {
    return <h2>Admin Dashboard</h2>;
}