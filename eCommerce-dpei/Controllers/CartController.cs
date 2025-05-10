using AutoMapper;
using eCommerce_dpei.Data;
using eCommerce_dpei.DTOS;
using eCommerce_dpei.Filters;
using eCommerce_dpei.Models;
using eCommerce_dpei.repository;
using eCommerce_dpei.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;
using System;
using System.Threading.Tasks;
using System.Collections.Generic; 

namespace eCommerce_dpei.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [ServiceFilter(typeof(ValidatorFilter))]
    public class CartController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly ICartRepository _repository;
        private readonly EcommerceContext _context; 
        private readonly IUnitOfWork _unitOfWork; 

        public CartController(ICartRepository repository, IMapper mapper, EcommerceContext context, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _mapper = mapper;
            _context = context; 
            _unitOfWork = unitOfWork; 
        }

        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] CartDto dto)
        {
            try
            {
                var product = await _context.Products.FindAsync(dto.ProductId);
                if (product == null)
                {
                    return NotFound(new { Message = "Product not found" });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { Message = "Invalid user identifier." });
                }

                var existingCartItem = await _repository.Get(c => c.CustomerId == userId && c.ProductId == dto.ProductId);
                var prospectiveQuantity = (existingCartItem?.Quantity ?? 0) + dto.Quantity;

                if (product.Stock < prospectiveQuantity)
                {
                    return BadRequest(new { Message = $"Not enough stock available. Requested total: {prospectiveQuantity}, Available: {product.Stock}" });
                }

                var cartItem = await _repository.Create(dto, userId);
                return Ok(new { Message = "Item added/updated in cart successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding to cart: {ex}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Error adding item to cart." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { Message = "Invalid user identifier." });
                }

                var cartItems = await _repository.GetAll(c => c.CustomerId == userId);

                if (!cartItems.Any())
                {
                    return Ok(new List<Cart>());
                }

                return Ok(cartItems);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving cart: {ex}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Error retrieving cart." });
            }
        }

        [HttpPut("{productId}")]
        public async Task<IActionResult> UpdateCartItem(int productId, [FromBody] CartUpdateDto dto)
        {
            if (dto.Quantity <= 0)
            {
                return BadRequest(new { Message = "Quantity must be positive." });
            }
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { Message = "Invalid user identifier." });
                }

                var success = await _repository.Update(productId, userId, dto);

                if (!success)
                {
                    return NotFound(new { Message = "Cart item not found, product not found, or requested quantity exceeds stock." });
                }
                return Ok(new { Message = "Cart item updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating cart item: {ex}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Error updating cart item." });
            }
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromCart(int productId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { Message = "Invalid user identifier." });
                }

                var deletedCartItem = await _repository.Delete(productId, userId);

                if (deletedCartItem == null)
                {
                    return NotFound(new { Message = "Cart item not found" });
                }
                return Ok(new { Message = "Item removed from cart successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing cart item: {ex}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Error removing item from cart." });
            }
        }
    }
}