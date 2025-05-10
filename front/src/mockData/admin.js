// src/mockData/index.js

// --- Base Mock Data Definitions ---

export const mockCartData = [
    { id: 101, customerId: 1, productId: 1, quantity: 2, addedDate: "2023-10-27T10:00:00Z", updatedAt: "2023-10-27T10:05:00Z", product: { id: 1, categoryId: 2, name: "Laptop Pro 15", description: "High-performance laptop", price: 1299.99, stock: 50, images: [{id: 1, imageUrl: "https://placehold.co/100", isPrimary: true}] } },
    { id: 102, customerId: 1, productId: 2, quantity: 1, addedDate: "2023-10-26T15:30:00Z", updatedAt: "2023-10-26T15:30:00Z", product: { id: 2, categoryId: 3, name: "Wireless Mouse", description: "Ergonomic mouse", price: 25.50, stock: 100, images: [{id: 2, imageUrl: "https://placehold.co/100", isPrimary: true}] } },
    { id: 103, customerId: 1, productId: 3, quantity: 3, addedDate: "2023-10-27T11:00:00Z", updatedAt: "2023-10-27T11:00:00Z", product: { id: 3, categoryId: 4, name: "T-Shirt", description: "Cotton T-Shirt", price: 19.99, stock: 0, images: [{id: 3, imageUrl: "https://placehold.co/100", isPrimary: true}] } }
  ];
  
  export const mockAddressData = [
      { id: 1, customerId: 1, streetAddress: "123 Main St", city: "Anytown", state: "CA", postalCode: "90210", country: "USA", isDefault: true },
      { id: 2, customerId: 1, streetAddress: "456 Oak Ave", city: "Someville", state: "NY", postalCode: "10001", country: "USA", isDefault: false }
  ];
  
  export let mockCategories = [ // Use let if modified by create simulation
    { id: 1, name: "Electronics", description: "Gadgets and devices", parentId: null, createdAt: "2023-10-01T10:00:00Z", updatedAt: "2023-10-01T10:00:00Z", isActive: true },
    { id: 2, name: "Laptops", description: "Portable computers", parentId: 1, createdAt: "2023-10-01T10:05:00Z", updatedAt: "2023-10-01T10:05:00Z", isActive: true },
    { id: 3, name: "Accessories", description: "Computer peripherals", parentId: 1, createdAt: "2023-10-01T10:06:00Z", updatedAt: "2023-10-01T10:06:00Z", isActive: true },
    { id: 4, name: "Clothing", description: "Apparel and garments", parentId: null, createdAt: "2023-10-02T11:00:00Z", updatedAt: "2023-10-02T11:00:00Z", isActive: true }
  ];
  
  export let mockProducts = [ // Use let if modified by create simulation
     { id: 1, categoryId: 2, name: "Laptop Pro 15", description: "High-performance laptop", price: 1299.99, stock: 50, createdAt: "2023-10-05T09:00:00Z", updatedAt: "2023-10-05T09:00:00Z", isActive: true, images: [{id: 1, imageUrl: "https://placehold.co/100", isPrimary: true}] },
     { id: 2, categoryId: 3, name: "Wireless Mouse", description: "Ergonomic mouse", price: 25.50, stock: 100, createdAt: "2023-10-05T09:05:00Z", updatedAt: "2023-10-05T09:05:00Z", isActive: true, images: [{id: 2, imageUrl: "https://placehold.co/100", isPrimary: true}] },
     { id: 3, categoryId: 4, name: "T-Shirt", description: "Cotton T-Shirt", price: 19.99, stock: 200, createdAt: "2023-10-06T14:00:00Z", updatedAt: "2023-10-06T14:00:00Z", isActive: true, images: [{id: 3, imageUrl: "https://placehold.co/100", isPrimary: true}] },
  ];
  
  // --- Mutable Copies (Define AFTER base data) ---
  // These are used by components to simulate state changes during the session
  export let currentMockCart = [...mockCartData];
  export let currentMockAddresses = [...mockAddressData];
  // Note: currentMockCategories/Products are not strictly needed if we modify
  // mockCategories/mockProducts directly in the create simulations below.
  
  // --- ID Counters ---
  let nextCategoryId = Math.max(...mockCategories.map(c => c.id), 0) + 1;
  let nextProductId = Math.max(...mockProducts.map(p => p.id), 0) + 1;
  // let nextCartItemId = Math.max(...mockCartData.map(i => i.id), 0) + 1; // If needed
  let nextAddressId = Math.max(...mockAddressData.map(a => a.id), 0) + 1;
  
  // --- Simulation Helper ---
  const simulateApiCall = (data, delay = 500) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  };
  
  // --- API Simulation Functions ---
  
  export const simulateFetchCart = () => {
      console.log("Simulating GET /api/cart");
      return simulateApiCall([...currentMockCart]); // Return a copy
  };
  
  export const simulateUpdateCartQuantity = (cartItemId, newQuantity) => {
      console.log(`Simulating PUT /api/cart/${cartItemId}`, { quantity: newQuantity });
      return simulateApiCall(null).then(() => {
          const itemIndex = currentMockCart.findIndex(item => item.id === cartItemId);
          if (itemIndex > -1 && newQuantity >= 1) {
              currentMockCart[itemIndex].quantity = newQuantity;
              currentMockCart[itemIndex].updatedAt = new Date().toISOString();
              return { success: true };
          }
          throw new Error("Item not found or invalid quantity");
      });
  };
  
  export const simulateRemoveCartItem = (cartItemId) => {
       console.log(`Simulating DELETE /api/cart/${cartItemId}`);
       return simulateApiCall(null).then(() => {
          const initialLength = currentMockCart.length;
          currentMockCart = currentMockCart.filter(item => item.id !== cartItemId);
          if (currentMockCart.length < initialLength) {
              return { success: true };
          }
          throw new Error("Item not found");
       });
  };
  
  export const simulateFetchAddresses = () => {
      console.log("Simulating GET /api/addresses");
      return simulateApiCall([...currentMockAddresses]);
  };
  
  export const simulateSaveAddress = (addressData) => {
      console.log("Simulating POST /api/addresses", addressData);
      return simulateApiCall(null, 800).then(() => {
          const newAddress = {
              id: nextAddressId++,
              customerId: 1, // Assume customer ID 1
              ...addressData,
              isDefault: currentMockAddresses.length === 0
          };
          currentMockAddresses.push(newAddress);
          return { ...newAddress }; // Return copy
      });
  };
  
  export const simulatePlaceOrder = (orderData) => {
      console.log("Simulating POST /api/orders", orderData);
      return simulateApiCall({ orderId: Date.now(), status: 'success' }, 1500).then((result) => {
          // Clear the cart on successful order placement
          currentMockCart = [];
          return result;
      });
  };
  
  
  export const simulateFetchCategories = () => {
      console.log("Simulating GET /api/categories");
      return simulateApiCall([...mockCategories]); // Return a copy
  };
  
  export const simulateCreateCategory = (categoryData) => {
      console.log("Simulating POST /api/categories", categoryData);
      return simulateApiCall(null, 800).then(() => {
          const newCategory = {
              id: nextCategoryId++,
              ...categoryData,
              parentId: categoryData.parentId ? parseInt(categoryData.parentId, 10) : null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
          };
          mockCategories.push(newCategory); // Modify the original exported array
          console.log("Mock Categories after creation:", mockCategories);
          return { ...newCategory };
      });
  };
  
  export const simulateCreateProduct = (productData) => {
      console.log("Simulating POST /api/products", productData);
      return simulateApiCall(null, 1000).then(() => {
          const newProduct = {
              id: nextProductId++,
              ...productData,
              price: parseFloat(productData.price),
              stock: parseInt(productData.stock, 10),
              categoryId: parseInt(productData.categoryId, 10),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
              images: [], reviews: [], cartItems: [], orderItems: []
          };
          mockProducts.push(newProduct); // Modify the original exported array
          console.log("Mock Products after creation:", mockProducts);
          return { ...newProduct };
      });
  };