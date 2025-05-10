import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { fetchOrderById, cancelOrder, API_BASE_URL, fetchAddresses } from '../utils/api';

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState(null);
    const [cancelError, setCancelError] = useState(null);

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) return;
            setLoading(true);
            setError(null);
            setCancelError(null);
            try {
                const fetchedOrder = await fetchOrderById(orderId);
                setOrder(fetchedOrder);
                
                // Fetch addresses to match with order's addressId
                const addressList = await fetchAddresses();
                setAddresses(addressList);
            } catch (err) {
                console.error(`Failed to load order ${orderId}:`, err);
                setError(err.message || `Could not load details for order #${orderId}.`);
            } finally {
                setLoading(false);
            }
        };
        loadOrder();
    }, [orderId]);

    // Find matching address based on addressId
    const getOrderAddress = () => {
        if (!order || !order.addressId || !addresses || addresses.length === 0) {
            return null;
        }
        return addresses.find(addr => addr.id === order.addressId);
    };

    const handleCancelOrder = async () => {
        if (!order || order.status?.toLowerCase() !== 'pending') {
             setCancelError("Order can only be cancelled if it's in 'Pending' status.");
             return;
        }
        if (!window.confirm(`Are you sure you want to cancel order #${order.id}?`)) return;

        setCancelling(true);
        setCancelError(null);
        setError(null);
        try {
            await cancelOrder(order.id);
            setOrder(prev => ({ ...prev, status: 'cancelled' })); 
        } catch (err) {
             console.error(`Failed to cancel order ${order.id}:`, err);
             setCancelError(err.message || `Could not cancel order #${order.id}.`);
        } finally {
            setCancelling(false);
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

     const getProductImageUrl = (product) => {
       const placeholder = `https://placehold.co/60x60/eee/ccc?text=N/A`;
       // Check product existence first
       if (!product || !product.images || product.images.length === 0) {
            return placeholder;
       }
       const primaryImage = product.images.find(img => img.isPrimary);
       let url = primaryImage?.imageUrl || product.images[0]?.imageUrl;

        if (url && !url.startsWith('http')) {
            url = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
       }
       return url || placeholder;
    };


    if (loading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading Order Details...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-4">
                <Alert variant="danger">{error}</Alert>
                <Link to="/orders">Back to Order History</Link>
            </Container>
        );
    }

    if (!order) {
         return (
            <Container className="my-4">
                <Alert variant="warning">Order not found.</Alert>
                 <Link to="/orders">Back to Order History</Link>
            </Container>
         );
    }

    const canCancel = order.status?.toLowerCase() === 'pending';
    const orderAddress = getOrderAddress();

    return (
        <Container className="my-4">
            <h2>Order Details #{order.id}</h2>
            {cancelError && <Alert variant="danger" onClose={() => setCancelError(null)} dismissible>{cancelError}</Alert>}

            <Row>
                <Col md={12}>
                     <Card className="mb-3">
                        <Card.Header>Order Summary</Card.Header>
                        <Card.Body>
                            <p><strong>Order ID:</strong> #{order.id}</p>
                            <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                            <p><strong>Status:</strong> <Badge bg={getStatusBadge(order.status)}>{order.status || 'Unknown'}</Badge></p>
                            {order.shippingTrackingNumber && <p><strong>Tracking #:</strong> {order.shippingTrackingNumber}</p>}
                            <p><strong>Total:</strong> ${order.totalPrice?.toFixed(2) ?? 'N/A'}</p>
                        </Card.Body>
                    </Card>
                     <Card className="mb-3">
                        <Card.Header>Shipping Address</Card.Header>
                        <Card.Body>
                            {orderAddress ? (
                                <>
                                    <p>{orderAddress.streetAddress}</p>
                                    <p>{orderAddress.city}, {orderAddress.state} {orderAddress.postalCode}</p>
                                    <p>{orderAddress.country}</p>
                                </>
                            ) : (
                                <p>Shipping address details unavailable. Address ID: {order.addressId}</p>
                            )}
                        </Card.Body>
                    </Card>
                    {canCancel && (
                         <div className="d-grid">
                             <Button
                                 variant="danger"
                                 onClick={handleCancelOrder}
                                 disabled={cancelling || order.status?.toLowerCase() === 'cancelled'}
                              >
                                 {cancelling ? <Spinner size="sm" animation="border" /> : 'Cancel Order'}
                             </Button>
                         </div>
                    )}
                </Col>
            </Row>
            <div className="mt-3">
                <Link to="/orders">Back to Order History</Link>
            </div>
        </Container>
    );
}