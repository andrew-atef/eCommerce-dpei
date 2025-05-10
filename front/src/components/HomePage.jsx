import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Alert, Spinner, Image, Pagination } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProducts, fetchCategories, addToCart, API_BASE_URL } from '../utils/api';
import { isAdmin as checkIsAdmin } from '../utils/auth';
import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css'; // Already in App.jsx
import './HomePage.css'; // Your HomePage specific styles

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsPerPage] = useState(9); // Or your preferred number
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAdmin(checkIsAdmin());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadingError(null); // Clear previous loading errors
    setActionError(null); // Clear previous action errors
    try {
      const categoryPromise = fetchCategories();
      // Pass currentPage and productsPerPage to fetchProducts
      const productPromise = fetchProducts(currentPage, productsPerPage);

      // Use Promise.allSettled to handle individual promise failures gracefully
      const results = await Promise.allSettled([
        productPromise,
        categoryPromise,
      ]);

      const productsResult = results[0];
      const categoriesResult = results[1];

      let combinedErrors = [];

      if (productsResult.status === 'fulfilled' && productsResult.value) {
          setProducts(productsResult.value.products || []);
          setTotalProducts(productsResult.value.totalCount || 0);
      } else {
          consterrMsg = `Products Error: ${productsResult.reason?.message || 'Unknown error fetching products'}`;
          console.error('Products fetch failed:', productsResult.reason);
          combinedErrors.push(errMsg);
          setProducts([]); // Clear products on error
          setTotalProducts(0);
      }

      if (categoriesResult.status === 'fulfilled' && categoriesResult.value) {
          setCategories(categoriesResult.value || []);
      } else {
           const errMsg = `Categories Error: ${categoriesResult.reason?.message || 'Unknown error fetching categories'}`;
           console.error('Categories fetch failed:', categoriesResult.reason);
           combinedErrors.push(errMsg);
      }

      if (combinedErrors.length > 0) {
        setLoadingError(combinedErrors.join('\n'));
      }

    } catch (err) { // Catch unexpected errors from Promise.allSettled or other logic
      console.error('Error fetching data:', err);
      setLoadingError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, productsPerPage]); // Add dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized with useCallback

  const handleAddToCart = async (productId, productName) => {
    if (isAdmin) return; // Admins should not add to cart from this view
    setActionError(null);
    setAddingToCartId(productId);
    try {
      await addToCart(productId, 1); // Assuming quantity 1
      toast.success(`${productName} added to cart!`);
    } catch (err) {
      console.error(`Failed to add product ${productId} to cart:`, err);
      const errorMessage = err.message || (err.status === 401 ? 'Please log in to add items to cart.' : 'Could not add item to cart.');
      setActionError(errorMessage);
      toast.error(errorMessage);
    } finally {
        setAddingToCartId(null);
    }
  };

  const handleEditProduct = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

   const getProductImageUrl = (product) => {
       const placeholder = `https://placehold.co/600x400/eee/ccc?text=${encodeURIComponent(product?.name || 'No Image')}`;
       if (!product?.images || product.images.length === 0) {
            return placeholder;
       }
       // Find primary image, or fallback to the first image
       const primaryImage = product.images.find(img => img.isPrimary === true); // Explicitly check for true
       let url = primaryImage?.imageUrl || product.images[0]?.imageUrl;

       if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
       }
       return url || placeholder; // Fallback to placeholder if URL is still falsy
   };

   const totalPages = Math.ceil(totalProducts / productsPerPage);

   const handlePageChange = (pageNumber) => {
       if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
           setCurrentPage(pageNumber);
           window.scrollTo({ top: 0, behavior: 'smooth' });
       }
   };

   const renderPaginationItems = () => {
       if (totalPages <= 1) return null;

       let items = [];
       const maxPagesToShow = 5; // Number of page links to show (excluding prev/next/first/last)
       let startPage, endPage;

       if (totalPages <= maxPagesToShow) {
           startPage = 1;
           endPage = totalPages;
       } else {
           const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
           const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
           if (currentPage <= maxPagesBeforeCurrent) {
               startPage = 1;
               endPage = maxPagesToShow;
           } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
               startPage = totalPages - maxPagesToShow + 1;
               endPage = totalPages;
           } else {
               startPage = currentPage - maxPagesBeforeCurrent;
               endPage = currentPage + maxPagesAfterCurrent;
           }
       }

       // First and Previous
       items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />);
       items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />);

       // Ellipsis at the start if needed
       if (startPage > 1) {
           items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
       }

       // Page numbers
       for (let page = startPage; page <= endPage; page++) {
           items.push(
               <Pagination.Item key={page} active={page === currentPage} onClick={() => handlePageChange(page)}>
                   {page}
               </Pagination.Item>
           );
       }

       // Ellipsis at the end if needed
       if (endPage < totalPages) {
            items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
       }
        // Next and Last
       items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
       items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />);

       return items;
   };

  return (
    <>
      {/* ToastContainer is now in App.jsx */}

      <div className="bg-light p-4 p-md-5 rounded-lg m-3 text-center hero-section">
        <Container>
            <h1 className="display-4 fw-bold">Welcome to EasyMart</h1>
            <p className="lead">Discover amazing products and shop with confidence.</p>
            <hr className="my-4" />
            <p>Browse our categories or check out the latest products below.</p>
        </Container>
      </div>


      <Container className="my-4">
        {/* Combined Loading Error and Action Error Display */}
        {(loadingError || actionError) && (
          <Alert variant={loadingError ? "danger" : "warning"} onClose={() => { setLoadingError(null); setActionError(null); }} dismissible>
            {loadingError && loadingError.split('\n').map((line, i) => <div key={`load-err-${i}`}>{line}</div>)}
            {actionError && <div>{actionError}</div>}
          </Alert>
        )}

         <h2 className="mb-3">Categories</h2>
         {loading && !categories.length ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /> Loading categories...</div>
         ) : !loadingError?.includes("Categories Error") && categories.length > 0 ? (
            <div className="category-slider-container mb-4">
                 {categories.map(category => (
                   <div key={category.id} className="category-slide-item">
                     <Card className="h-100 text-decoration-none" > {/* Make category clickable */}
                       <Card.Body className="text-center">
                         <Card.Title className="mb-1 fs-6 text-truncate">{category.name}</Card.Title>
                         {/* <Card.Text className="small text-muted text-truncate">{category.description || 'Explore collection'}</Card.Text> */}
                       </Card.Body>
                     </Card>
                   </div>
                 ))}
           </div>
         ) : (
           !loadingError?.includes("Categories Error") && !loading && <p>No categories found.</p>
         )}

        <h2 className="mb-4 mt-5" id="products">Products</h2>
        {loading && !products.length ? ( // Show spinner only if products aren't loaded yet
            <div className="text-center py-5">
                 <Spinner animation="border" role="status" style={{ width: '3rem', height: '3rem' }}>
                   <span className="visually-hidden">Loading Products...</span>
                 </Spinner>
            </div>
        ) : !loadingError?.includes("Products Error") && products.length > 0 ? (
          <>
            <Row xs={1} sm={2} md={3} lg={3} xl={3} className="g-4"> {/* Adjusted grid for responsiveness */}
              {products.map(product => (
                <Col key={product.id}>
                  <Card className="h-100 shadow-sm product-card">
                    <Link to={`/`} className="text-decoration-none text-dark"> {/* Product image and title link to product detail */}
                      <Card.Img
                        variant="top"
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="product-card-img"
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/eee/ccc?text=Load+Error`; }}
                      />
                      <Card.Body className="d-flex flex-column pb-2"> {/* Reduced bottom padding */}
                        <Card.Title className="product-title h6">{product.name}</Card.Title>
                      </Card.Body>
                    </Link>
                    {/* Separated Body for price, stock, and button */}
                    <Card.Body className="d-flex flex-column pt-0"> {/* Removed top padding */}
                      <Card.Text className="text-muted small flex-grow-1 product-description mb-2">
                        {product.description || 'No description available.'}
                      </Card.Text>
                      <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                        <Card.Text className="fw-bold mb-0 fs-5">
                          ${product.price != null ? product.price.toFixed(2) : 'N/A'}
                        </Card.Text>
                        <Card.Text className="text-muted small mb-0">
                          Stock: {product.stock ?? 'N/A'}
                        </Card.Text>
                      </div>
                      {isAdmin ? (
                        <Button
                          variant="outline-secondary" // Changed variant for admin
                          className="mt-2 w-100 btn-sm" // smaller button
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <i className="fas fa-edit me-1"></i> Edit Product
                        </Button>
                      ) : (
                        <Button
                          variant={product.stock === 0 ? "outline-danger" : "primary"}
                          className="mt-2 w-100"
                          onClick={() => handleAddToCart(product.id, product.name)}
                          disabled={product.stock === 0 || addingToCartId === product.id}
                        >
                          {addingToCartId === product.id ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          ) : product.stock === 0 ? (
                            'Out of Stock'
                          ) : (
                            <><i className="fas fa-cart-plus me-1"></i> Add to Cart</>
                          )}
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4 pt-2">
                    <Pagination>{renderPaginationItems()}</Pagination>
                </div>
            )}
          </>
        ) : (
           !loadingError?.includes("Products Error") && !loading && <Alert variant="info" className="text-center">No products found matching your criteria.</Alert>
        )}
      </Container>

      <footer className="bg-dark text-white py-4 mt-5">
         <Container className="text-center">
           <p className="mb-0">© {new Date().getFullYear()} eCommerce-dpei App. All Rights Reserved.</p>
           {/* <p className="small mb-0">Crafted with <i className="fas fa-heart text-danger"></i> by dpei</p> */}
         </Container>
      </footer>
    </>
  );
}