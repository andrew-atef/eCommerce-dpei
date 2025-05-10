import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';
import {
    fetchCart,
    fetchProductById,
    placeOrder,
    fetchAddresses,
    saveAddress,
    setDefaultAddress
} from '../utils/api';

const ONE_SIGNAL_APP_ID = 'b0c32bc9-bf93-4c87-b478-e3d1b8a4a44f';
const ONE_SIGNAL_REST_API_KEY = 'os_v2_app_wdbsxsn7sngipndy4pi3rjfej75cmrraktwuaz5hayhkgd5xb6fxpfj3vg2xythrq5cr6d2jey6aki2mb3sw7vtbhkjykkyfsae5aui';

const sendNewOrderNotificationToAdmin = async (orderInfo) => {
    const orderId = orderInfo && orderInfo.id ? orderInfo.id : null;
    const message = orderId
        ? `New order #${orderId} has been placed. Click to view.`
        : "A new order has been placed. Click to view.";

    const adminOrderUrl = "http://localhost:5173/admin/orders";

    const notificationPayload = {
        app_id: ONE_SIGNAL_APP_ID,
        contents: {
            en: message
        },
        headings: {
            en: "🎉 New Order Received!"
        },
        url: adminOrderUrl,
        included_segments: ["Subscribed Users"],
    };

    console.log("Attempting to send OneSignal notification with payload:", JSON.stringify(notificationPayload, null, 2));

    try {
        const response = await fetch('https://api.onesignal.com/notifications?c=push', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${ONE_SIGNAL_REST_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationPayload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('OneSignal API Error:', responseData.errors || responseData.message || `HTTP ${response.status}`);
            return { success: false, error: responseData.errors || responseData.message || `HTTP error ${response.status}` };
        }

        console.log('OneSignal notification sent successfully:', responseData);
        if (responseData.id && responseData.recipients === 0) {
            console.warn("OneSignal: Notification sent (ID: " + responseData.id + "), but no recipients were targeted. Check your segments/filters in OneSignal dashboard.");
            return { success: true, warning: "0 recipients", details: responseData };
        }
         if (!responseData.id && (!responseData.errors || responseData.errors.length === 0)) {
            console.warn("OneSignal: Notification request might have been acknowledged, but no notification ID returned and no recipients. Check OneSignal dashboard for errors.", responseData);
            return { success: false, warning: "No recipients or issue, no ID returned", details: responseData };
        }
        return { success: true, details: responseData };

    } catch (error) {
        console.error('Error sending OneSignal notification:', error);
        return { success: false, error: error.message };
    }
};


export default function CheckoutPage({ navigate: propNavigate }) {
  const reactRouterNavigate = useRouterNavigate();
  const navigate = propNavigate || reactRouterNavigate;

  const [detailedCartItems, setDetailedCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    streetAddress: '', city: '', state: '', postalCode: '', country: '', isDefault: false
  });
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [settingDefault, setSettingDefault] = useState(null);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const clearAddressErrors = useCallback(() => {
    setError(prev => (prev?.includes("Cart Error:") || prev?.includes("Warning:")) ? prev : null);
  }, []);

  const loadCartAndProductDetails = useCallback(async () => {
    setLoadingCart(true);
    setError(prev => prev?.includes("Address Error:") ? prev : null);
    try {
      const rawCartData = await fetchCart();
      let basicCartItems = [];

      if (Array.isArray(rawCartData)) {
          basicCartItems = rawCartData;
      } else if (rawCartData && typeof rawCartData === 'object' && rawCartData.productId) {
          basicCartItems = [rawCartData];
      } else if (rawCartData !== null && rawCartData !== undefined) {
           console.warn("fetchCart returned unexpected data format for checkout. Received:", rawCartData);
           if (!error?.includes("address")) {
               setError(prev => prev ? `${prev}\nCart Error: Unexpected format` : 'Cart Error: Unexpected format');
           }
      }

      if (basicCartItems.length === 0) {
        setDetailedCartItems([]);
        if (!error?.includes("address") && rawCartData !== null && rawCartData !== undefined) {
             if (rawCartData) {
                 setError("Your cart is empty. Add items before checking out.");
             }
        }
        setLoadingCart(false);
        return;
      }

      const productDetailPromises = basicCartItems.map(item => {
         if (item && item.productId) {
             return fetchProductById(item.productId).catch(err => {
                 console.error(`Failed to fetch product ${item.productId} for checkout:`, err);
                 return { error: true, productId: item.productId };
             });
         } else {
             console.warn("Checkout page: Cart item is invalid or missing productId:", item);
             return Promise.resolve(null);
         }
      });

      const productFetchResults = await Promise.all(productDetailPromises);

      const combinedItems = basicCartItems
        .filter(item => item && item.productId)
        .map((item, index) => {
           const fetchResult = productFetchResults[index];
           const productData = (fetchResult && !fetchResult.error && fetchResult.result)
                                ? fetchResult.result
                                : null;
           if (!productData && fetchResult && !fetchResult.error) {
                console.warn(`Checkout: Product data for ${item.productId} missing 'result' property`, fetchResult);
           }
            return {
               ...item,
               product: productData
             };
        });

      const failedProductLoads = combinedItems.filter(item => !item.product).length;
      if (failedProductLoads > 0) {
          console.warn(`${failedProductLoads} product(s) failed to load details for checkout summary.`);
          setError(prev => {
              const newErr = `Warning: Details for ${failedProductLoads} product(s) could not be loaded.`;
              return prev ? `${prev}\n${newErr}` : newErr;
          });
      }
      setDetailedCartItems(combinedItems);
    } catch (err) {
      console.error("Failed to load cart details for checkout:", err);
       setError(prev => prev ? `${prev}\nCart Error: ${err.message}` : `Cart Error: ${err.message}`);
       setDetailedCartItems([]);
    } finally {
      setLoadingCart(false);
    }
  }, [error]);

  const loadAddresses = useCallback(async (selectSavedId = null) => {
    setLoadingAddresses(true);
    clearAddressErrors();
    try {
      const data = await fetchAddresses();
      const addressesData = data || [];
      setAddresses(addressesData);
      const defaultAddress = addressesData.find(addr => addr.isDefault);
      const currentSelectedExists = addressesData.some(a => a.id === selectedAddressId);

      let targetId = selectSavedId ?? selectedAddressId;

      if (!selectSavedId && (!selectedAddressId || !currentSelectedExists)) {
          targetId = defaultAddress?.id ?? addressesData?.[0]?.id ?? null;
      }
      setSelectedAddressId(targetId);

      if (!targetId && addressesData.length === 0) {
          setShowNewAddressForm(true);
      } else if (targetId && addressesData.length > 0 && showNewAddressForm && !selectSavedId) {
          setShowNewAddressForm(false);
      }

    } catch (err) {
       console.error("Fetch addresses error:", err);
       setError(prev => prev ? `${prev}\nAddress Error: ${err.message}` : `Address Error: ${err.message}`);
       setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [selectedAddressId, showNewAddressForm, clearAddressErrors]);

  useEffect(() => {
    loadCartAndProductDetails();
    loadAddresses();
  }, [loadCartAndProductDetails, loadAddresses]);

  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    clearAddressErrors();
  };

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    clearAddressErrors();
    try {
        const savedAddress = await saveAddress(newAddress);
        await loadAddresses(savedAddress.id);
        setShowNewAddressForm(false);
        setNewAddress({ streetAddress: '', city: '', state: '', postalCode: '', country: '', isDefault: false });
    } catch (err) {
        console.error("Save address error:", err);
        setError(prev => prev ? `${prev}\nAddress Error: ${err.message}` : `Address Error: ${err.message}`);
    } finally {
        setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
      if (settingDefault) return;
      setSettingDefault(addressId);
      clearAddressErrors();
      try {
          await setDefaultAddress(addressId);
          await loadAddresses(addressId);
      } catch (err) {
          console.error("Set default address error:", err);
          setError(prev => prev ? `${prev}\nAddress Error: ${err.message}` : `Address Error: ${err.message}`);
      } finally {
          setSettingDefault(null);
      }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a shipping address.");
      return;
    }
    const validCartItems = detailedCartItems?.filter(item => item.product);
    if (!validCartItems || validCartItems.length === 0) {
        setError("Your cart is empty or contains only unavailable items. Cannot place order.");
        loadCartAndProductDetails();
        return;
    }

    setPlacingOrder(true);
    setError(null);
    let orderResult;
    try {
        orderResult = await placeOrder(selectedAddressId);
        console.log("Order placed successfully:", orderResult);

        if (orderResult) {
            sendNewOrderNotificationToAdmin(orderResult)
                .then(notificationStatus => {
                    if (notificationStatus.success) {
                        console.log("Admin notification dispatch initiated successfully.", notificationStatus.details);
                        if(notificationStatus.warning) console.warn("OneSignal dispatch warning: ", notificationStatus.warning, notificationStatus.details);
                    } else {
                        console.warn("Admin notification dispatch initiation failed.", notificationStatus.error || notificationStatus.details);
                    }
                })
                .catch(err => {
                    console.error("Critical error during admin notification dispatch process:", err);
                });
        } else {
            console.warn("Order result was not available, skipping admin notification.");
        }

        setDetailedCartItems([]);
        setOrderSuccess(orderResult || { message: "Order placed successfully." });
        
        setTimeout(() => {
            if (navigate && typeof navigate === 'function') {
               navigate('/orders');
            } else {
               console.error("Navigate function not available or not a function in CheckoutPage. Falling back to window.location.");
               window.location.href = '/orders';
            }
        }, 3000);

    } catch (err) {
        console.error("Place order error:", err);
        setError(err.message || 'Could not place order.');
    } finally {
        setPlacingOrder(false);
    }
  };

   const calculateOrderTotal = () => {
    const validItems = detailedCartItems?.filter(item => item.product);
    if (!validItems) return 0;
    return validItems.reduce((total, item) => {
        const price = item.product.price ?? 0;
        const quantity = item.quantity ?? 0;
        return total + (price * quantity);
    }, 0);
  };

  const isLoading = loadingCart || loadingAddresses;
  const addressLoadFailed = !!error?.includes("Address Error:");
  const cartIsEmpty = !loadingCart && (!detailedCartItems || detailedCartItems.filter(item => item.product).length === 0);
  const hasUnavailableItems = detailedCartItems?.some(item => !item.product);

  if (isLoading && detailedCartItems.length === 0 && addresses.length === 0 && !error) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading Checkout...</span>
        </Spinner>
      </Container>
    );
  }

  if (orderSuccess) {
      return (
          <Container className="my-5 text-center">
              <Alert variant="success">
                  <Alert.Heading>Order Placed Successfully!</Alert.Heading>
                  <p>Thank you for your purchase. {orderSuccess.id ? `Order ID: ${orderSuccess.id}.` : ''} You will be redirected to your orders page shortly.</p>
              </Alert>
          </Container>
      );
  }

  return (
    <Container className="my-4">
      <h2>Checkout</h2>
      {error && <Alert variant={error.startsWith("Warning:") ? "warning" : "danger"} onClose={() => setError(null)} dismissible>{error.split('\n').map((line, i) => <div key={i}>{line}</div>)}</Alert>}

      {loadingCart && detailedCartItems.length === 0 && !error?.includes("Cart Error:") ? (
          <Card className="mb-3"><Card.Body className="text-center"><Spinner animation="border" size="sm" /><span> Loading cart summary...</span></Card.Body></Card>
      ) : cartIsEmpty && !error?.includes("Cart Error:") && !loadingCart ? (
           <Alert variant="info">Your cart is currently empty or all items are unavailable. Please add products to your cart to proceed.</Alert>
      ) : (
        <Row>
            <Col md={8} className="mb-3 mb-md-0">
                <Card>
                    <Card.Header>Order Summary</Card.Header>
                    {loadingCart ? (
                        <Card.Body className="text-center"><Spinner animation="border" size="sm" /><span> Loading summary...</span></Card.Body>
                    ) : (
                        <ListGroup variant="flush">
                        {detailedCartItems.map(item => {
                            const productAvailable = !!item.product;
                            const productName = productAvailable ? item.product.name : 'Product Unavailable';
                            const productPrice = productAvailable ? item.product.price : 0;
                            return (
                                <ListGroup.Item key={item.id || item.productId} className={`d-flex justify-content-between align-items-center ${!productAvailable ? 'text-danger fst-italic' : ''}`}>
                                    <div>
                                    {productName} <span className="text-muted">x {item.quantity}</span>
                                    {!productAvailable && <small className="d-block text-danger">This item could not be loaded and will not be included in the order.</small>}
                                    </div>
                                    <span>
                                        {productAvailable ? `$${(productPrice * item.quantity).toFixed(2)}` : 'N/A'}
                                    </span>
                                </ListGroup.Item>
                            );
                        })}
                        <ListGroup.Item className="d-flex justify-content-between align-items-center fw-bold">
                            <span>Total (for available items)</span>
                            <span>${calculateOrderTotal().toFixed(2)}</span>
                        </ListGroup.Item>
                        </ListGroup>
                    )}
                </Card>
                 {hasUnavailableItems && !loadingCart && (
                    <Alert variant="warning" className="mt-3">
                        Some items in your cart are unavailable and will not be included in the final order. The total reflects available items only.
                    </Alert>
                )}
            </Col>

            <Col md={4}>
                <Card className="mb-3">
                    <Card.Header>Shipping Address</Card.Header>
                    <Card.Body>
                    {loadingAddresses && !addressLoadFailed ? <div className="text-center"><Spinner animation="border" size="sm" /><span> Loading addresses...</span></div> : (
                        <>
                           {!loadingAddresses && !addressLoadFailed && addresses.map(addr => (
                            <div key={addr.id} className="mb-2 d-flex justify-content-between align-items-center">
                                <Form.Check
                                    type="radio"
                                    id={`addr-${addr.id}`}
                                    name="shippingAddress"
                                    value={addr.id}
                                    checked={selectedAddressId === addr.id}
                                    onChange={(e) => { clearAddressErrors(); setSelectedAddressId(parseInt(e.target.value));}}
                                    label={`${addr.streetAddress}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`}
                                    disabled={savingAddress || placingOrder || settingDefault === addr.id}
                                />
                                <div className="ms-2 flex-shrink-0">
                                {!addr.isDefault && (
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                    disabled={settingDefault === addr.id || savingAddress || placingOrder}
                                    title="Set as default address"
                                >
                                    {settingDefault === addr.id ? <Spinner animation="border" size="sm" /> : 'Set Default'}
                                </Button>
                                )}
                                {addr.isDefault && <small className="text-muted ms-1">(Default)</small>}
                                </div>
                            </div>
                            ))}
                            {addresses.length === 0 && !showNewAddressForm && !loadingAddresses && !addressLoadFailed && (
                                <p className="text-muted">No addresses found. Please add one.</p>
                            )}
                            {!addressLoadFailed && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-3 w-100"
                                    onClick={() => { clearAddressErrors(); setShowNewAddressForm(!showNewAddressForm);}}
                                    aria-expanded={showNewAddressForm}
                                    disabled={savingAddress || placingOrder || settingDefault}
                                >
                                    {showNewAddressForm ? 'Cancel Adding Address' : (addresses.length > 0 ? 'Add New Address' : 'Add Address')}
                                </Button>
                             )}
                        </>
                    )}

                    {showNewAddressForm && (
                        <Form onSubmit={handleSaveNewAddress} className="mt-3 border p-3 rounded bg-light">
                        <h5 className="mb-3">Add New Shipping Address</h5>
                        <Form.Group className="mb-2" controlId="formStreet">
                            <Form.Label>Street Address</Form.Label>
                            <Form.Control type="text" name="streetAddress" value={newAddress.streetAddress} onChange={handleNewAddressChange} required disabled={savingAddress} />
                        </Form.Group>
                        <Row>
                            <Col sm={6} className="mb-2">
                                <Form.Label>City</Form.Label>
                                <Form.Control type="text" name="city" value={newAddress.city} onChange={handleNewAddressChange} required disabled={savingAddress} />
                            </Col>
                            <Col sm={6} className="mb-2">
                                <Form.Label>State</Form.Label>
                                <Form.Control type="text" name="state" value={newAddress.state} onChange={handleNewAddressChange} required disabled={savingAddress} />
                            </Col>
                        </Row>
                        <Row>
                            <Col sm={6} className="mb-2">
                                <Form.Label>Postal Code</Form.Label>
                                <Form.Control type="text" name="postalCode" value={newAddress.postalCode} onChange={handleNewAddressChange} required disabled={savingAddress} />
                            </Col>
                            <Col sm={6} className="mb-2">
                                <Form.Label>Country</Form.Label>
                                <Form.Control type="text" name="country" value={newAddress.country} onChange={handleNewAddressChange} required disabled={savingAddress} />
                            </Col>
                        </Row>
                        <Form.Group className="my-2" controlId="formIsDefault">
                            <Form.Check
                            type="checkbox"
                            name="isDefault"
                            label="Set as default address"
                            checked={newAddress.isDefault}
                            onChange={handleNewAddressChange}
                            disabled={savingAddress}
                            />
                        </Form.Group>
                        <Button variant="success" type="submit" disabled={savingAddress} className="w-100">
                            {savingAddress ? <><Spinner size="sm" animation="border" /> Saving...</> : 'Save Address'}
                        </Button>
                        </Form>
                    )}
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Header>Payment Information</Card.Header>
                    <Card.Body>
                        <Form.Check
                            type="radio"
                            id="payment-cod"
                            label="Cash on Delivery"
                            name="paymentMethod"
                            checked
                            readOnly
                        />
                        <p className="text-muted mt-2 small">
                            Payment will be collected upon delivery of your order.
                        </p>
                    </Card.Body>
                </Card>

                 <div className="d-grid">
                    <Button
                    variant="primary"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={
                        !selectedAddressId ||
                        addressLoadFailed ||
                        placingOrder ||
                        savingAddress ||
                        settingDefault !== null ||
                        loadingCart ||
                        loadingAddresses ||
                        cartIsEmpty ||
                        hasUnavailableItems
                        }
                    >
                    {placingOrder ? <><Spinner size="sm" animation="border" /> Placing Order...</> : 'Place Order (Cash on Delivery)'}
                    </Button>
                </div>
                {(!selectedAddressId && !loadingAddresses && !addressLoadFailed) && <Alert variant="info" className="mt-2 small">Please select or add a shipping address to proceed.</Alert>}
            </Col>
        </Row>
      )}
    </Container>
  );
}