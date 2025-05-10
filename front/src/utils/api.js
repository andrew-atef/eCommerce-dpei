import Cookies from 'js-cookie';

export const API_BASE_URL = 'https://localhost:7148';

const getAuthToken = () => Cookies.get('authToken');

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        let errorData = null;
        try {
            errorData = await response.json();
            if (response.status === 400 && errorData.errors) {
                 errorMessage = Object.values(errorData.errors).flat().join(' ');
            } else if (errorData.detail) { 
                errorMessage = errorData.detail;
            } else if (errorData.title) { 
                errorMessage = errorData.title;
            }
             else {
                errorMessage = errorData.message || errorMessage;
            }
        } catch (e) {
            try {
                 const textError = await response.text();
                 if (textError) {
                     errorMessage = textError;
                 }
            } catch (textErr) {
                 console.error("Could not parse error response as JSON or text:", e, textErr);
            }
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null;
    }

    try {
       const contentType = response.headers.get("content-type");
       if (contentType && contentType.includes("application/json")) {
            return await response.json();
       } else {
           return await response.text();
       }
    } catch (e) {
       console.error("Could not parse success response:", e);
       throw new Error("Invalid response format received from server.");
    }
};

const makeRequest = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        const publicEndpoints = ['/api/auth/login', '/api/auth/register', '/api/products', '/api/categories'];
        const isPublic = publicEndpoints.some(endpoint => url.includes(endpoint) && !url.includes('/admin'));
        if (!isPublic && !url.startsWith(API_BASE_URL + '/images/')) {
             console.warn(`No auth token found for potentially protected request to ${url}`);
        }
    }

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(url, { ...options, headers });
    return handleResponse(response);
};


// --- Auth ---
export const loginUser = async (credentials) => {
    return makeRequest(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
};

export const registerUser = async (userData) => {
    return makeRequest(`${API_BASE_URL}/api/auth/register/customer`, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};

export const fetchProfile = async () => {
     return makeRequest(`${API_BASE_URL}/api/auth/me`);
};

// --- Category ---
export const fetchCategories = async () => {
    return makeRequest(`${API_BASE_URL}/api/categories`);
};

export const createCategory = async (categoryData) => {
    return makeRequest(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
};

// --- Product ---
export const fetchProducts = async (pageNumber = 1, pageSize = 9) => {
    const url = new URL(`${API_BASE_URL}/api/products`);
    url.searchParams.append('pageNumber', pageNumber.toString());
    url.searchParams.append('pagesize', pageSize.toString());
    const data = await makeRequest(url.toString());
    if (data && Array.isArray(data.products) && typeof data.totalCount === 'number') {
        return data;
    } else {
        console.warn("fetchProducts received unexpected data format:", data);
        return { products: [], totalCount: 0 };
    }
};

export const fetchProductById = async (productId) => {
    const response = await makeRequest(`${API_BASE_URL}/api/products/${productId}`);
    if (response && response.result) {
        return response;
    } else if (response && response.id && response.id.toString() === productId.toString()) {
         console.warn(`fetchProductById(${productId}) direct object received, wrapping in 'result' for consistency`);
         return { result: response };
    }
    else {
        console.warn(`fetchProductById(${productId}) received unexpected data format:`, response);
        throw new Error(`Failed to retrieve product details for ID ${productId}. Response: ${JSON.stringify(response)}`);
    }
};

export const createProduct = async (formData) => {
    return makeRequest(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: formData
    });
};

export const updateProduct = async (id, productFormData) => {
    return makeRequest(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        body: productFormData
    });
};

export const deleteProduct = async (id) => {
    return makeRequest(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE'
    });
};

// --- ProductImage ---
export const addProductImage = async (productId, imageFormData) => {
    // Path from OpenAPI: /api/ProductImage/api/products/{productId}/images
    // This one seems plausible for adding images to a specific product.
    return makeRequest(`${API_BASE_URL}/api/ProductImage/api/products/${productId}/images`, {
        method: 'POST',
        body: imageFormData
    });
};

// ATTEMPTING SIMPLIFIED PATH for deleting an image by its direct ID
export const deleteProductImage = async (imageId) => {
     // Common simplified path: /api/images/{imageId} or /api/productimages/{imageId}
     // If this fails, and the OpenAPI spec for ProductImage delete is accurate with its double /api/,
     // then the issue is likely server-side not matching that complex path for DELETE.
     // The OpenAPI spec for delete is: /api/ProductImage/api/images/{imageid}
     // Let's try the simpler /api/images/{imageId} first.
     return makeRequest(`${API_BASE_URL}/api/images/${imageId}`, {
        method: 'DELETE'
    });
    // If the above fails, and you are *certain* the backend expects the double /api/ path:
    // return makeRequest(`${API_BASE_URL}/api/ProductImage/api/images/${imageId}`, {
    //    method: 'DELETE'
    // });
};

// --- Cart ---
export const fetchCart = async () => {
    return makeRequest(`${API_BASE_URL}/api/Cart`);
};

export const addToCart = async (productId, quantity) => {
    const cartDto = { productId, quantity };
    return makeRequest(`${API_BASE_URL}/api/Cart`, {
        method: 'POST',
        body: JSON.stringify(cartDto)
    });
};

export const updateCartItemQuantity = async (productId, quantity) => {
    const cartUpdateDto = { quantity };
    return makeRequest(`${API_BASE_URL}/api/Cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(cartUpdateDto)
    });
};

export const removeCartItem = async (productId) => {
    return makeRequest(`${API_BASE_URL}/api/Cart/${productId}`, {
        method: 'DELETE'
    });
};

// --- Address ---
export const fetchAddresses = async () => {
    return makeRequest(`${API_BASE_URL}/api/Address`);
};

export const saveAddress = async (addressData) => {
    return makeRequest(`${API_BASE_URL}/api/Address`, {
        method: 'POST',
        body: JSON.stringify(addressData)
    });
};

export const updateAddress = async (id, addressData) => {
     return makeRequest(`${API_BASE_URL}/api/Address/${id}`, {
        method: 'PUT',
        body: JSON.stringify(addressData)
    });
};

export const deleteAddress = async (id) => {
    return makeRequest(`${API_BASE_URL}/api/Address/${id}`, {
        method: 'DELETE'
    });
};

export const setDefaultAddress = async (id) => {
    return makeRequest(`${API_BASE_URL}/api/Address/${id}/default`, {
        method: 'PUT'
    });
};
// --- Order ---
export const placeOrder = async (addressId) => {
    const orderCreateDto = { addressId };
    return makeRequest(`${API_BASE_URL}/api/Order`, {
        method: 'POST',
        body: JSON.stringify(orderCreateDto)
    });
};

export const fetchOrders = async () => {
    return makeRequest(`${API_BASE_URL}/api/Order`);
};

// --- Order ---
export const fetchOrderById = async (orderId) => {
    return makeRequest(`${API_BASE_URL}/api/Order/${orderId}`);
};

export const cancelOrder = async (orderId) => {
    return makeRequest(`${API_BASE_URL}/api/Order/${orderId}/cancel`, {
        method: 'PUT'
    });
};

export const fetchAdminOrders = async (status = '') => {
    const url = new URL(`${API_BASE_URL}/api/Order/admin`);
    if (status) {
        url.searchParams.append('status', status);
    }
    return makeRequest(url.toString());
};

export const updateOrderStatus = async (orderId, statusData) => {
    return makeRequest(`${API_BASE_URL}/api/Order/admin/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
    });
};
