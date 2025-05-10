import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const ROLE_CLAIM_TYPE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export const getUserRole = () => {
  const token = Cookies.get('authToken');
  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwtDecode(token);
    const role = decodedToken[ROLE_CLAIM_TYPE];

    if (Array.isArray(role)) {
      return role.includes('Admin') ? 'Admin' : role[0] || null;
    }
    return role || null;

  } catch (error) {
    console.error("Failed to decode token or find role:", error);
    Cookies.remove('authToken');
    return null;
  }
};

export const isAdmin = () => {
    return getUserRole() === 'Admin';
};