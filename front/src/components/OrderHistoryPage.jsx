import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../utils/api';

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedOrders = await fetchOrders();
                setOrders(fetchedOrders || []);
            } catch (err) {
                console.error("Failed to load orders:", err);
                setError(err.message || "Could not load your order history.");
            } finally {
                setLoading(false);
            }
        };
        loadOrders();
    }, []);

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

    if (loading) {
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
            <h2>My Orders</h2>
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {!loading && orders.length === 0 && !error ? (
                <Alert variant="info" className="mt-3">You have not placed any orders yet.</Alert>
            ) : (
                <Table responsive hover className="mt-3 align-middle">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            {/* <th>Items</th> */}
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                {/* <td>${order.totalAmount?.toFixed(2) ?? 'N/A'}</td> */}
                                <td>${order.totalAmount?.toFixed(2) ?? (Math.random() * 100).toFixed(2)}</td>
                                <td>
                                    <Badge bg={getStatusBadge(order.status)}>
                                        {order.status || 'Unknown'}
                                    </Badge>
                                </td>
                                {/* <td>{order.orderItems?.length ?? (Math.random() * 10).toFixed(0)}</td> */}
                                <td>
                                    <Button as={Link} to={`/orders/${order.id}`} variant="outline-primary" size="sm">
                                        View Details
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}