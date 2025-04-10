using eCommerce_dpei.Data;
using eCommerce_dpei.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace eCommerce_dpei.Controllers
{
    [Route("api/categories")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly EcommerceContext _context;

        public CategoryController(EcommerceContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAllCategories()
        {
            try
            {
                var categories = _context.Categories.ToList();
                return Ok(categories); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting categories: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetCategory(int id)
        {
            try
            {
                var category = _context.Categories.Find(id);
                if (category == null)
                {
                    return NotFound(new { Message = "Category not found" });
                }
                return Ok(category); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting category: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryDto dto)
        {
            try
            {
                var category = new Category
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    ParentId = dto.ParentId,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    IsActive = true
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Category created successfully", CategoryId = category.Id });
            }
            catch (Exception ex)
            {
                // Include inner exception details
                return BadRequest(new { Message = "Error creating category: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryDto dto)
        {
            try
            {
                var category = _context.Categories.Find(id);
                if (category == null)
                {
                    return NotFound(new { Message = "Category not found" });
                }

                category.Name = dto.Name;
                category.Description = dto.Description;
                category.ParentId = dto.ParentId;
                category.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Category updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error updating category: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var category = _context.Categories.Find(id);
                if (category == null)
                {
                    return NotFound(new { Message = "Category not found" });
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Category deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error deleting category: " + ex.Message + " | Inner: " + ex.InnerException?.Message });
            }
        }
    }
}