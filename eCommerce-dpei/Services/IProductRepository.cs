using eCommerce_dpei.DTOS;
using eCommerce_dpei.Models;
using System.Threading.Tasks;

public interface IProductRepository
{
    bool isCategoryExist(int Id);
    Product GetProduct(int id);
    Task<Product> CreateProduct(ProductDto dto);
    Task<bool> UpdateProduct(int id, ProductDto dto);
    Task<Product> DeleteProduct(int id);
    PaginatedProductsDto GetAllProducts(int pagenumber, int pagesize);
}