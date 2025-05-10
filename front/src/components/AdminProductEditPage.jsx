import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert, Spinner, Row, Col, Image, CloseButton } from 'react-bootstrap';
import {
  fetchProductById,
  fetchCategories,
  updateProduct,
  deleteProduct,
  // addProductImage, // No longer directly used in handleSubmit if PUT /api/products/{id} handles new images
  deleteProductImage,
  API_BASE_URL
} from '../utils/api';
import { toast } from 'react-toastify';

export default function AdminProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    Name: '', Description: '', Price: '', Stock: '', CategoryId: ''
  });
  const [currentImages, setCurrentImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [categories, setCategories] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [submittingDeleteProduct, setSubmittingDeleteProduct] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);


  const getFullImageUrl = (relativeUrl) => {
    if (!relativeUrl) return `https://placehold.co/150x150/eee/ccc?text=No+Image`;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) return relativeUrl;
    return `${API_BASE_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  };

  const loadProductData = useCallback(async () => {
    setLoadingProduct(true);
    setError(null);
    try {
      const productApiResponse = await fetchProductById(productId);
      if (productApiResponse && productApiResponse.result) {
        const p = productApiResponse.result;
        setFormData({
          Name: p.name || '',
          Description: p.description || '',
          Price: p.price?.toString() || '0',
          Stock: p.stock?.toString() || '0',
          CategoryId: p.category?.id?.toString() || ''
        });
        setCurrentImages(p.images || []);
      } else {
        throw new Error("Product data not found or in an unexpected format.");
      }
    } catch (err) {
      console.error("Failed to load product:", err);
      setError(err.message || "Failed to load product details. It might have been deleted.");
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  const loadCategoriesData = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError(prev => prev ? `${prev}\n${err.message}` : (err.message || "Failed to load categories."));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadProductData();
    loadCategoriesData();
  }, [loadProductData, loadCategoriesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleNewImageChange = (e) => {
    setNewImageFiles(Array.from(e.target.files));
    if (error) setError(null);
  };

  const handleMarkImageForDeletion = (imageId) => {
    if (!imagesToDelete.includes(imageId)) {
      setImagesToDelete(prev => [...prev, imageId]);
    }
  };

  const handleUndoMarkImageForDeletion = (imageId) => {
    setImagesToDelete(prev => prev.filter(id => id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.CategoryId) {
      const msg = "Please select a category.";
      setError(msg); toast.error(msg); return;
    }
    const price = parseFloat(formData.Price);
    if (isNaN(price) || price <= 0) {
      const msg = "Please enter a valid positive price.";
      setError(msg); toast.error(msg); return;
    }
    const stock = parseInt(formData.Stock, 10);
    if (isNaN(stock) || stock < 0) {
      const msg = "Please enter a valid non-negative stock quantity.";
      setError(msg); toast.error(msg); return;
    }

    setSubmittingUpdate(true);
    let overallSuccess = true;

    const productUpdateFormData = new FormData();
    productUpdateFormData.append('Name', formData.Name);
    productUpdateFormData.append('Description', formData.Description || '');
    productUpdateFormData.append('Price', price.toString());
    productUpdateFormData.append('Stock', stock.toString());
    productUpdateFormData.append('CategoryId', formData.CategoryId);

    if (newImageFiles.length > 0) {
        newImageFiles.forEach(file => {
            productUpdateFormData.append('Images', file);
        });
    }

    try {
        await updateProduct(productId, productUpdateFormData);
        setNewImageFiles([]);
        if(document.getElementById('productNewImages')) {
            document.getElementById('productNewImages').value = null;
        }

        let deletedImageCount = 0;
        if (imagesToDelete.length > 0) {
            for (const imageId of imagesToDelete) {
                try {
                    setDeletingImageId(imageId);
                    await deleteProductImage(imageId); // This calls the corrected API path
                    deletedImageCount++;
                } catch (imgErr) {
                    console.error(`Failed to delete image ${imageId}:`, imgErr);
                    toast.error(`Failed to delete image ${imageId}: ${imgErr.message}`);
                    overallSuccess = false;
                } finally {
                    setDeletingImageId(null);
                }
            }
            if (deletedImageCount > 0) toast.info(`${deletedImageCount} image(s) marked for deletion were processed.`);
            setImagesToDelete([]);
        }
      
        if (overallSuccess) {
            toast.success("Product update process completed successfully!");
        } else {
            toast.warn("Product update process completed with some errors (see console/toast).");
        }
        
        await loadProductData();

    } catch (err) {
      console.error("Failed to update product:", err);
      setError(err.message || "Failed to update product main details.");
      toast.error(err.message || "Product update failed.");
      overallSuccess = false;
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE product "${formData.Name || 'this product'}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setSubmittingDeleteProduct(true);
    try {
      await deleteProduct(productId);
      toast.success(`Product "${formData.Name}" deleted successfully! Redirecting...`);
      navigate('/'); 
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError(err.message || "Failed to delete product.");
      toast.error(err.message || "Product deletion failed.");
      setSubmittingDeleteProduct(false);
    }
  };

  if (loadingProduct || loadingCategories) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading Product Editor...</span>
        </Spinner>
      </Container>
    );
  }
   if (error && !formData.Name && !loadingProduct) { 
    return (
      <Container>
        <Alert variant="danger" className="mt-3">
          <h4>Error Loading Product Data</h4>
          <p>{error}</p>
          <Button onClick={() => navigate('/admin')} variant="secondary">Back to Admin Dashboard</Button>
        </Alert>
      </Container>
    );
  }


  return (
    <Container>
      <Card className="shadow-sm">
        <Card.Header as="h4">Edit Product: {formData.Name || `ID: ${productId}`}</Card.Header>
        <Card.Body>
          {error && !submittingUpdate && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error.split('\n').map((line,i) => <div key={`err-${i}`}>{line}</div>)}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="productName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                required
                disabled={submittingUpdate || submittingDeleteProduct}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="productDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                disabled={submittingUpdate || submittingDeleteProduct}
              />
            </Form.Group>

            <Row className="mb-3">
              <Form.Group as={Col} md={6} controlId="productPrice">
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
                  disabled={submittingUpdate || submittingDeleteProduct}
                />
              </Form.Group>

              <Form.Group as={Col} md={6} controlId="productStock">
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
                  disabled={submittingUpdate || submittingDeleteProduct}
                />
              </Form.Group>
            </Row>

            <Form.Group className="mb-3" controlId="productCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="CategoryId"
                value={formData.CategoryId}
                onChange={handleChange}
                required
                disabled={submittingUpdate || submittingDeleteProduct || loadingCategories}
                aria-label="Select product category"
              >
                <option value="">-- Select a Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
              {loadingCategories && <Spinner size="sm" animation="border" className="ms-2 align-middle" />}
            </Form.Group>

            <hr className="my-4"/>
            <h5>Manage Images</h5>
            
            <Form.Group controlId="currentProductImages" className="mb-3">
              <Form.Label>Current Images</Form.Label>
              {currentImages.length > 0 ? (
                <Row xs={2} sm={3} md={4} lg={5} className="g-3">
                  {currentImages.map(image => (
                    <Col key={image.id} className="position-relative">
                      <Card className={`position-relative ${imagesToDelete.includes(image.id) ? 'border-danger opacity-50' : ''}`}>
                        <Image 
                            src={getFullImageUrl(image.imageUrl)} 
                            alt={`Product image ${image.id}`}
                            thumbnail 
                            fluid 
                            style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                            onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/150x150/eee/ccc?text=Error`; }}
                        />
                        {deletingImageId === image.id ? (
                           <div className="position-absolute top-0 end-0 m-1 p-1 bg-light rounded-circle d-flex justify-content-center align-items-center" style={{width: '24px', height: '24px'}}>
                             <Spinner animation="border" size="sm" variant="danger"/>
                           </div>
                        ) : imagesToDelete.includes(image.id) ? (
                           <Button variant="outline-warning" size="sm" className="position-absolute top-0 end-0 m-1" onClick={() => handleUndoMarkImageForDeletion(image.id)} disabled={submittingUpdate || submittingDeleteProduct} title="Undo Mark for Deletion">
                             <i className="fas fa-undo"></i>
                           </Button>
                        ) : (
                           <CloseButton 
                             className="position-absolute top-0 end-0 m-1 bg-danger text-white rounded-circle p-1"
                             onClick={() => handleMarkImageForDeletion(image.id)} 
                             disabled={submittingUpdate || submittingDeleteProduct || deletingImageId === image.id} 
                             title="Mark for Deletion"
                           />
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Alert variant="info" className="text-center">No current images for this product.</Alert>
              )}
               {imagesToDelete.length > 0 && <Alert variant='warning' className="mt-2 small p-2">{imagesToDelete.length} image(s) marked for deletion. These will be deleted when you save changes.</Alert>}
            </Form.Group>
            
            <Form.Group controlId="productNewImages" className="mb-3">
              <Form.Label>Add New Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleNewImageChange}
                disabled={submittingUpdate || submittingDeleteProduct}
                accept="image/jpeg, image/png, image/gif, image/webp"
              />
              {newImageFiles.length > 0 && (
                <div className="mt-2 text-muted">
                  <small>{newImageFiles.length} file(s) selected for upload: {newImageFiles.map(f => f.name).join(', ')}</small>
                </div>
              )}
            </Form.Group>

            <hr className="my-4"/>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <Button variant="primary" type="submit" disabled={submittingUpdate || submittingDeleteProduct || loadingCategories || loadingProduct}>
                {submittingUpdate ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Updating...</> : <><i className="fas fa-save me-1"></i> Update Product</>}
              </Button>
              <Button variant="danger" onClick={handleDeleteProduct} disabled={submittingUpdate || submittingDeleteProduct || loadingProduct}>
                {submittingDeleteProduct ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Deleting...</> : <><i className="fas fa-trash-alt me-1"></i> Delete Product</>}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}