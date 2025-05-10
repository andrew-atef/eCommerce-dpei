import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';
import { createCategory, fetchCategories } from '../utils/api';

export default function AdminCategoryForm() {
  const [formData, setFormData] = useState({ name: '', description: '', parentId: '' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const categoryPayload = {
        name: formData.name,
        description: formData.description || null,
        parentId: formData.parentId ? parseInt(formData.parentId, 10) : null,
      };
      const createdCategory = await createCategory(categoryPayload);
      setSuccess(`Category "${createdCategory.name}" created successfully! (ID: ${createdCategory.id})`);
      setFormData({ name: '', description: '', parentId: '' });
       const fetchedCategories = await fetchCategories();
       setCategories(fetchedCategories || []);
    } catch (err) {
      console.error("Failed to create category:", err);
      setError(err.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <Card>
        <Card.Header>Create New Category</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="categoryName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="categoryDescription">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="categoryParent">
              <Form.Label>Parent Category (Optional)</Form.Label>
              {loadingCategories ? <Spinner size="sm" animation="border" /> : (
                <Form.Select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-label="Select parent category"
                >
                  <option value="">-- None (Top Level) --</option>
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

            <Button variant="primary" type="submit" disabled={submitting || loadingCategories}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Create Category'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}