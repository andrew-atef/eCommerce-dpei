using AutoMapper;
using eCommerce_dpei.Data;
using eCommerce_dpei.DTOS;
using eCommerce_dpei.Models;
using eCommerce_dpei.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;

namespace eCommerce_dpei.repository
{
    public class CartRepository : ICartRepository
    {
        private readonly EcommerceContext _context;
        private readonly IMapper _mapper;
        public CartRepository(EcommerceContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Cart> Create([FromBody] CartDto dto, int userId)
        {
            var existingCartItem = await Get(c => c.CustomerId == userId && c.ProductId == dto.ProductId);
            Cart resultCartItem;
            if (existingCartItem != null)
            {
                existingCartItem.Quantity += dto.Quantity;
                existingCartItem.UpdatedAt = DateTime.Now;
                _context.Cart.Update(existingCartItem);
                resultCartItem = existingCartItem;
            }
            else
            {
                var newCartItem = _mapper.Map<Cart>(dto);
                newCartItem.CustomerId = userId;
                await _context.Cart.AddAsync(newCartItem);
                resultCartItem = newCartItem;
            }

            await _context.SaveChangesAsync();
            return resultCartItem;
        }

        public async Task<Cart>? Delete(int productId, int userId)
        {
            var cartItem = await Get(c => c.CustomerId == userId && c.ProductId == productId);

            if (cartItem == null)
            {
                return null;
            }
            _context.Cart.Remove(cartItem);
            await _context.SaveChangesAsync();
            return cartItem;
        }

        public Cart? Get(int id)
        {
            return GetById(id);
        }

        public async Task<Cart>? Get(Expression<Func<Cart, bool>> predicate)
        {
            return await _context.Cart.FirstOrDefaultAsync(predicate);
        }

        public async Task<IEnumerable<Cart>> GetAll(Expression<Func<Cart, bool>> predicate)
        {
            return await _context.Cart.Include(cart => cart.Product).Where(predicate).ToListAsync();
        }


        public Cart? GetById(int Id)
        {
            return _context.Cart.Find(Id);
        }

        public async Task<bool> Update(int productId, int userId, [FromBody] CartUpdateDto dto)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return false; 
            }

            var cartItem = await Get(c => c.CustomerId == userId && c.ProductId == productId);

            if (cartItem == null)
            {
                return false; 
            }

            if (dto.Quantity > product.Stock)
            {
                return false; 
            }
            if (dto.Quantity <= 0)
            {
                return false;
            }

            _mapper.Map(dto, cartItem);
            cartItem.UpdatedAt = DateTime.Now; 

            await _context.SaveChangesAsync();
            return true;
        }
    }
}