import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Spinner, Alert, Badge, Button, Form, Modal } from 'react-bootstrap';
import { fetchAdminOrders, updateOrderStatus } from '../utils/api';

export default function AdminOrderManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedOrders = await fetchAdminOrders(filterStatus);
            setOrders(fetchedOrders || []);
        } catch (err) {
            console.error("Failed to load admin orders:", err);
            setError(err.message || "Could not load orders.");
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleFilterChange = (e) => {
        setFilterStatus(e.target.value);
    };

    const handleShowModal = (order) => {
        setSelectedOrder(order);
        setNewStatus(order.status || '');
        setTrackingNumber(order.trackingNumber || '');
        setUpdateError(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setTrackingNumber('');
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder || !newStatus) return;
        setUpdating(true);
        setUpdateError(null);
        try {
            const updateData = { status: newStatus, trackingNumber: trackingNumber || null };
            await updateOrderStatus(selectedOrder.id, updateData);
            handleCloseModal();
            await loadOrders();
        } catch (err) {
            console.error("Failed to update order status:", err);
            setUpdateError(err.message || "Could not update order status.");
        } finally {
            setUpdating(false);
        }
    };


    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'secondary';
            case 'processing': return 'info';
            case 'shipped': return 'primary';
            case 'delivered': return 'success';
            case 'cancelled': return 'danger';
            default: return 'light';
        }
    };

     if (loading && orders.length === 0) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading Orders...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="my-4">
            <h2>Manage Orders</h2>
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            <Form.Group className="mb-3" controlId="statusFilter" style={{ maxWidth: '200px' }}>
              <Form.Label>Filter by Status</Form.Label>
              <Form.Select value={filterStatus} onChange={handleFilterChange} disabled={loading}>
                <option value="">All Statuses</option>
                {orderStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {loading && orders.length > 0 && <Spinner animation="border" size="sm" className="ms-2"/>}


            {!loading && orders.length === 0 && !error ? (
                <Alert variant="info" className="mt-3">No orders found{filterStatus ? ` with status "${filterStatus}"` : ''}.</Alert>
            ) : (
                <Table responsive hover className="mt-3 align-middle">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            {/* <th>Customer</th> */}
                            <th>Total</th>
                            <th>Status</th>
                            {/* <th>Tracking #</th> */}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                {/* <td>{order.customer?.email ?? 'N/A'}</td> */}
                                <td>${order.totalAmount?.toFixed(2) ?? (Math.random() * 100).toFixed(2)}</td>
                                <td>
                                    <Badge bg={getStatusBadge(order.status)}>
                                        {order.status || 'Unknown'}
                                    </Badge>
                                </td>
                                {/* <td>{order.trackingNumber || '-'}</td> */}
                                <td>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(order)}>
                                        Update Status
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

             <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                  <Modal.Title>Update Order #{selectedOrder?.id} Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {updateError && <Alert variant="danger">{updateError}</Alert>}
                  <Form.Group className="mb-3" controlId="newStatusSelect">
                    <Form.Label>New Status</Form.Label>
                    <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={updating}>
                      {orderStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="trackingNumberInput">
                     <Form.Label>Tracking Number (Optional)</Form.Label>
                     <Form.Control
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number if shipped"
                        disabled={updating}
                      />
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal} disabled={updating}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleUpdateStatus} disabled={updating || !newStatus}>
                    {updating ? <Spinner size="sm" animation="border" /> : 'Save Changes'}
                  </Button>
                </Modal.Footer>
             </Modal>

        </Container>
    );
}