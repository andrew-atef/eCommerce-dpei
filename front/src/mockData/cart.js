
export const mockCartData = [
    {
      id: 101,
      customerId: 1,
      productId: 1,
      quantity: 2,
      addedDate: "2023-10-27T10:00:00Z",
      updatedAt: "2023-10-27T10:05:00Z",
      product: {
        id: 1,
        categoryId: 1,
        name: "Laptop Pro 15",
        description: "High-performance laptop for professionals.",
        price: 1299.99,
        stock: 50,
        images: [
          { id: 1, productId: 1, imageUrl: "https://placehold.co/600x400/EEE/31343C?text=Laptop", isPrimary: true },
          { id: 2, productId: 1, imageUrl: "https://placehold.co/600x400/DDD/31343C?text=Laptop+Side", isPrimary: false }
        ]
      }
    },
    {
      id: 102,
      customerId: 1,
      productId: 3,
      quantity: 1,
      addedDate: "2023-10-26T15:30:00Z",
      updatedAt: "2023-10-26T15:30:00Z",
      product: {
        id: 3,
        categoryId: 2,
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse.",
        price: 25.50,
        stock: 100,
         images: [
            { id: 5, productId: 3, imageUrl: "https://placehold.co/600x400/CCC/31343C?text=Mouse", isPrimary: true }
         ]
      }
    },
     {
      id: 103,
      customerId: 1,
      productId: 5, 
      quantity: 3,
      addedDate: "2023-10-27T11:00:00Z",
      updatedAt: "2023-10-27T11:00:00Z",
      product: {
        id: 5,
        categoryId: 1,
        name: "USB-C Hub",
        description: "Multi-port USB-C adapter.",
        price: 39.99,
        stock: 0,
        images: [
            { id: 8, productId: 5, imageUrl: "https://placehold.co/600x400/BBB/31343C?text=USB+Hub", isPrimary: true }
        ]
      }
    }
  ];
  
  export const mockAddressData = [
      { id: 1, customerId: 1, streetAddress: "123 Main St", city: "Anytown", state: "CA", postalCode: "90210", country: "USA", isDefault: true },
      { id: 2, customerId: 1, streetAddress: "456 Oak Ave", city: "Someville", state: "NY", postalCode: "10001", country: "USA", isDefault: false }
  ];