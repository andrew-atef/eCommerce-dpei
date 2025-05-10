import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, InputGroup, FormControl } from 'react-bootstrap';
import { FaTrashAlt, FaPlus, FaMinus } from 'react-icons/fa';
import {
    fetchCart,
    updateCartItemQuantity,
    removeCartItem,
    fetchProductById,
    API_BASE_URL
} from '../utils/api';

export default function CartPage({ navigateToCheckout }) {
  const [detailedCartItems, setDetailedCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);

  const loadCartAndProductDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rawCartData = await fetchCart();
      let basicCartItems = [];

      if (Array.isArray(rawCartData)) {
          basicCartItems = rawCartData;
      } else if (rawCartData && typeof rawCartData === 'object' && rawCartData.productId) {
          basicCartItems = [rawCartData];
      } else if (rawCartData !== null && rawCartData !== undefined) {
          console.warn("fetchCart returned unexpected data format. Received:", rawCartData);
          setError("Failed to load cart items due to unexpected data format.");
      }

      if (basicCartItems.length === 0) {
        setDetailedCartItems([]);
        setLoading(false);
        return;
      }

      const productDetailPromises = basicCartItems.map(item => {
        if (item && item.productId) {
           return fetchProductById(item.productId).catch(err => {
               console.error(`Failed to fetch product ${item.productId}:`, err);
               return { error: true, productId: item.productId };
           });
        } else {
           console.warn("Cart item is invalid or missing productId:", item);
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
                console.warn(`Product data for ${item.productId} missing 'result' property`, fetchResult);
            }
            return {
               ...item,
               product: productData
             };
         });

      setDetailedCartItems(combinedItems);

    } catch (err) {
      console.error("Failed to load cart or product details:", err);
      setError(err.message || 'Could not load cart information.');
      setDetailedCartItems([]);
    } finally {
      setLoading(false);
      setUpdatingProductId(null);
    }
  }, []);

  useEffect(() => {
    loadCartAndProductDetails();
  }, [loadCartAndProductDetails]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingProductId(productId);
    setError(null);
    try {
      await updateCartItemQuantity(productId, newQuantity);
      await loadCartAndProductDetails();
    } catch (err) {
       console.error("Failed to update quantity:", err);
       setError(err.message || 'Could not update item quantity.');
       setUpdatingProductId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
     if (!window.confirm("Are you sure you want to remove this item?")) return;

     setUpdatingProductId(productId);
     setError(null);
     try {
       await removeCartItem(productId);
       await loadCartAndProductDetails();
     } catch (err) {
        console.error("Failed to remove item:", err);
        setError(err.message || 'Could not remove item from cart.');
        setUpdatingProductId(null);
     }
  };

  const calculateSubtotal = () => {
    if (!detailedCartItems) return 0;
    return detailedCartItems.reduce((total, item) => {
        const price = item?.product?.price ?? 0;
        const quantity = item?.quantity ?? 0;
        return total + (price * quantity);
    }, 0);
  };

  if (loading && detailedCartItems.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading Cart...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h2>Your Shopping Cart</h2>
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {!loading && (!detailedCartItems || detailedCartItems.length === 0) && !error ? (
        <Alert variant="info" className="mt-3">Your cart is empty.</Alert>
      ) : (
        <>
          <Table responsive hover className="mt-3 align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {detailedCartItems.map(item => {
                  const productId = item?.productId;
                  const productAvailable = !!item.product;
                  if (!productId) {
                      console.warn("Attempting to render cart item without productId:", item);
                      return null;
                  }
                  const productName = productAvailable ? item.product?.name : 'Product details unavailable';
                  const productPrice = productAvailable ? item.product?.price : 0;

                  return (
                      <tr key={productId}>
                        <td>{productName}</td>
                        <td>
                            {productAvailable ? `$${productPrice.toFixed(2)}` : 'N/A'}
                        </td>
                        <td>
                          <InputGroup size="sm" style={{ maxWidth: '130px' }}>
                            <Button
                              variant="outline-secondary"
                              onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                              disabled={!productAvailable || updatingProductId === productId || item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <FaMinus />
                            </Button>
                            <FormControl
                              type="text"
                              value={item.quantity}
                              readOnly
                              className="text-center"
                              style={{ width: '50px', backgroundColor: '#fff' }}
                              aria-label={`Quantity for ${productName}`}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                              disabled={!productAvailable || updatingProductId === productId}
                              aria-label="Increase quantity"
                            >
                               {updatingProductId === productId ? <Spinner size="sm" animation="border" /> : <FaPlus /> }
                            </Button>
                          </InputGroup>
                        </td>
                        <td>
                            {productAvailable ? `$${(productPrice * item.quantity).toFixed(2)}` : 'N/A'}
                        </td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveItem(productId)}
                            disabled={updatingProductId === productId || !productAvailable}
                            aria-label={`Remove ${productName} from cart`}
                          >
                            {updatingProductId === productId ? <Spinner size="sm" animation="border" /> : <FaTrashAlt />}
                          </Button>
                        </td>
                      </tr>
                  );
                }
              )}
            </tbody>
          </Table>

          <div className="text-end mt-4">
            <h4>Subtotal: ${calculateSubtotal().toFixed(2)}</h4>
            <Button
              variant="primary"
              size="lg"
              className="mt-2"
              onClick={navigateToCheckout}
              disabled={!detailedCartItems || detailedCartItems.length === 0 || detailedCartItems.some(item => !item.product) || loading}
            >
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}