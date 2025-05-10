import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { createProduct, fetchCategories } from '../utils/api';

export default function AdminProductForm() {
  const [formData, setFormData] = useState({
    Name: '', Description: '', Price: '', Stock: '', CategoryId: ''
  });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories || []);
      } catch (err) {
         console.error("Failed to load categories:", err);
         setError(err.message || "Failed to load categories for dropdown.");
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleImageChange = (e) => {
    setImages(e.target.files);
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.CategoryId) {
        setError("Please select a category.");
        return;
    }
    if (isNaN(parseFloat(formData.Price)) || parseFloat(formData.Price) <= 0) {
        setError("Please enter a valid positive price.");
        return;
    }
     if (isNaN(parseInt(formData.Stock, 10)) || parseInt(formData.Stock, 10) < 0) {
        setError("Please enter a valid non-negative stock quantity.");
        return;
    }
    if (!images || images.length === 0) {
        setError("Please select at least one image.");
        return;
    }

    setSubmitting(true);

    const productFormData = new FormData();
    productFormData.append('Name', formData.Name);
    productFormData.append('Description', formData.Description || '');
    productFormData.append('Price', formData.Price);
    productFormData.append('Stock', formData.Stock);
    productFormData.append('CategoryId', formData.CategoryId);

    for (let i = 0; i < images.length; i++) {
        productFormData.append('Images', images[i]);
    }

    try {
        const createdProduct = await createProduct(productFormData);
        setSuccess(`Product "${createdProduct.name || formData.Name}" created successfully! (ID: ${createdProduct.id})`);
        setFormData({ Name: '', Description: '', Price: '', Stock: '', CategoryId: '' });
        setImages([]);
        e.target.reset();

    } catch (err) {
      console.error("Failed to create product:", err);
      setError(err.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <Card>
        <Card.Header>Create New Product</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
          <Form onSubmit={handleSubmit} encType="multipart/form-data">
            <Form.Group className="mb-3" controlId="productName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="productDescription">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                disabled={submitting}
              />
            </Form.Group>

             <Row className="mb-3">
               <Form.Group as={Col} controlId="productPrice">
                 <Form.Label>Price</Form.Label>
                 <Form.Control
                   type="number"
                   name="Price"
                   placeholder="e.g., 19.99"
                   value={formData.Price}
                   onChange={handleChange}
                   required
                   step="0.01"
                   min="0.01"
                   disabled={submitting}
                 />
               </Form.Group>

               <Form.Group as={Col} controlId="productStock">
                 <Form.Label>Stock Quantity</Form.Label>
                 <Form.Control
                   type="number"
                   name="Stock"
                   placeholder="e.g., 100"
                   value={formData.Stock}
                   onChange={handleChange}
                   required
                   step="1"
                   min="0"
                   disabled={submitting}
                 />
               </Form.Group>
             </Row>

             <Form.Group className="mb-3" controlId="productCategory">
               <Form.Label>Category</Form.Label>
               {loadingCategories ? <Spinner size="sm" animation="border" /> : (
                 <Form.Select
                   name="CategoryId"
                   value={formData.CategoryId}
                   onChange={handleChange}
                   required
                   disabled={submitting}
                   aria-label="Select product category"
                 >
                   <option value="">-- Select a Category --</option>
                   {categories.map(cat => (
                     <option key={cat.id} value={cat.id}>
                       {cat.name}
                     </option>
                   ))}
                 </Form.Select>
               )}
               {!loadingCategories && error?.includes("load categories") && (
                    <Alert variant="warning" className="mt-2">{error}</Alert>
               )}
             </Form.Group>

             <Form.Group controlId="productImages" className="mb-3">
               <Form.Label>Images</Form.Label>
               <Form.Control
                 type="file"
                 name="Images"
                 multiple
                 onChange={handleImageChange}
                 required
                 disabled={submitting}
               />
               {images.length > 0 && (
                  <div className="mt-2">
                     <small>{images.length} file(s) selected</small>
                  </div>
               )}
             </Form.Group>


            <Button variant="primary" type="submit" disabled={submitting || loadingCategories}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Create Product'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}