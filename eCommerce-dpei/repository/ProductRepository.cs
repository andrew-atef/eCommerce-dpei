using eCommerce_dpei.Data;
using eCommerce_dpei.DTOS;
using eCommerce_dpei.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace eCommerce_dpei.repository
{
    public class ProductRepository : IProductRepository
    {
        private readonly EcommerceContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public ProductRepository(EcommerceContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        public bool isCategoryExist(int Id)
        {
            return _context.Categories.Any(c => c.Id == Id);
        }

        public Product GetProduct(int id)
        {
            return _context.Products
                           .Include(p => p.Images)
                           .FirstOrDefault(p => p.Id == id);
        }

        public async Task<Product> CreateProduct(ProductDto dto)
        {
            var product = new Product
            {
                CategoryId = dto.CategoryId,
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Stock = dto.Stock,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            if (dto.Images != null && dto.Images.Any())
            {
                product.Images = new List<ProductImage>();
                bool isFirstImage = true;

                foreach (var imageFile in dto.Images)
                {
                    if (imageFile.Length > 0)
                    {
                        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(imageFile.FileName)}";
                        var imagesProductFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images", "products");
                        var savePath = Path.Combine(imagesProductFolder, fileName);

                        if (!Directory.Exists(imagesProductFolder))
                        {
                            Directory.CreateDirectory(imagesProductFolder);
                        }

                        using (var stream = new FileStream(savePath, FileMode.Create))
                        {
                            await imageFile.CopyToAsync(stream);
                        }

                        var productImage = new ProductImage
                        {
                            ProductId = product.Id,
                            ImageUrl = $"/images/products/{fileName}",
                            IsPrimary = isFirstImage,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.ProductImages.Add(productImage);
                        isFirstImage = false;
                    }
                }
                await _context.SaveChangesAsync();
            }
            return product;
        }

        public async Task<bool> UpdateProduct(int id, ProductDto dto)
        {
            var product = await _context.Products
                                        .Include(p => p.Images)
                                        .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return false;
            }

            if (product.CategoryId != dto.CategoryId)
            {
                if (!isCategoryExist(dto.CategoryId))
                {
                    return false;
                }
                product.CategoryId = dto.CategoryId;
            }

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.Stock = dto.Stock;
            product.UpdatedAt = DateTime.UtcNow;

            if (dto.Images != null && dto.Images.Any())
            {
                if (product.Images != null && product.Images.Any())
                {
                    foreach (var oldImage in product.Images.ToList())
                    {
                        if (!string.IsNullOrEmpty(oldImage.ImageUrl))
                        {
                            var oldImagePhysicalPath = Path.Combine(_webHostEnvironment.WebRootPath, oldImage.ImageUrl.TrimStart('/'));
                            if (System.IO.File.Exists(oldImagePhysicalPath))
                            {
                                try { System.IO.File.Delete(oldImagePhysicalPath); }
                                catch (IOException) { /* Consider logging this error */ }
                            }
                        }
                        _context.ProductImages.Remove(oldImage);
                    }
                }

                product.Images = product.Images ?? new List<ProductImage>();
                if (!product.Images.Any()) product.Images = new List<ProductImage>();

                bool isFirstImage = true;
                foreach (var imageFile in dto.Images)
                {
                    if (imageFile.Length > 0)
                    {
                        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(imageFile.FileName)}";
                        var imagesProductFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images", "products");
                        var savePath = Path.Combine(imagesProductFolder, fileName);

                        if (!Directory.Exists(imagesProductFolder))
                        {
                            Directory.CreateDirectory(imagesProductFolder);
                        }

                        using (var stream = new FileStream(savePath, FileMode.Create))
                        {
                            await imageFile.CopyToAsync(stream);
                        }

                        var newProductImage = new ProductImage
                        {
                            ProductId = product.Id,
                            ImageUrl = $"/images/products/{fileName}",
                            IsPrimary = isFirstImage,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.ProductImages.Add(newProductImage);
                        isFirstImage = false;
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Products.AnyAsync(p => p.Id == id))
                {
                    return false;
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating product: {ex.Message}");
                return false;
            }
        }

        public async Task<Product> DeleteProduct(int id)
        {
            var product = await _context.Products
                                        .Include(p => p.Images)
                                        .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return null;
            }

            if (product.Images != null && product.Images.Any())
            {
                foreach (var image in product.Images.ToList())
                {
                    if (!string.IsNullOrEmpty(image.ImageUrl))
                    {
                        var imagePhysicalPath = Path.Combine(_webHostEnvironment.WebRootPath, image.ImageUrl.TrimStart('/'));
                        if (System.IO.File.Exists(imagePhysicalPath))
                        {
                            try { System.IO.File.Delete(imagePhysicalPath); }
                            catch (IOException) { /* Consider logging this error */ }
                        }
                    }
                }
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public PaginatedProductsDto GetAllProducts(int pagenumber, int pagesize)
        {
            var query = _context.Products
                                .Include(x => x.Images)
                                .OrderByDescending(p => p.CreatedAt);

            var totalCount = query.Count();
            var products = query
                            .Skip((pagenumber - 1) * pagesize)
                            .Take(pagesize)
                            .ToList();

            return new PaginatedProductsDto
            {
                TotalCount = totalCount,
                Products = products
            };
        }
    }
}