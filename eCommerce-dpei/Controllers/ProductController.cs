using eCommerce_dpei.Data;
using eCommerce_dpei.Filters;
using eCommerce_dpei.Models;
using eCommerce_dpei.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace eCommerce_dpei.Controllers
{
    [Route("api/products")]
    [ApiController]
    [ServiceFilter(typeof(ValidatorFilter))]
    public class ProductController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        public ProductController( IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        [HttpGet]
        public IActionResult GetAllProducts([FromQuery] int pageNumber=1 ,[FromQuery] int pagesize =10)
        {
            try
            {
                var products = _productRepository.GetAllProducts(pageNumber,pagesize);
                if (products == null) 
                    return NotFound(" Product Not Found");
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting products: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetProduct(int id)
        {
            try
            {
                var product = _productRepository.GetProduct(id);
                if (product == null)
                {
                    return NotFound(new { Message = "Product not found" });
                }
                return Ok(product); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting product: " + ex.Message + " | Inner: " + ex.InnerException?.Message });

            }
        }


        [HttpPost]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateProduct([FromForm] ProductDto dto)
        {
            try
            {
                if (!_productRepository.isCategoryExist(dto.CategoryId))
                {
                    return BadRequest(new { Message = "Invalid CategoryId: Category does not exist" });
                }
                var product =await _productRepository.CreateProduct(dto);
                
                return Ok(new { Message = "Product created successfully", ProductId = product.Id });


            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error creating product: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] ProductDto dto)
        {
            try
            {
                var success = await _productRepository.UpdateProduct(id, dto);

                if (!success) 
                    return NotFound(new { Message = "Product not found or invalid category." });
                return Ok(new { Message = "Product updated successfully" });

            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error updating product: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var product =await _productRepository.DeleteProduct(id);
                if (product == null)
                {
                    return NotFound(new { Message = "Product not found" });
                }

                return Ok(new { Message = "Product deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error deleting product: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }
    }
}