using eCommerce_dpei.DTOS;
using eCommerce_dpei.Models;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using System;

namespace eCommerce_dpei.Services 
{
    public interface ICartRepository
    {
        Task<Cart> Create(CartDto dto, int userId);
        Task<Cart>? Delete(int productId, int userId);
        Cart? Get(int id);
        Task<Cart>? Get(Expression<Func<Cart, bool>> predicate);
        Task<IEnumerable<Cart>> GetAll(Expression<Func<Cart, bool>> predicate);
        Cart? GetById(int id);
        Task<bool> Update(int productId, int userId, CartUpdateDto dto);
    }
}