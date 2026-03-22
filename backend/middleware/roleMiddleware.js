/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if user has required role
 * @param {string|array} requiredRole - Role(s) required to access the route
 */
module.exports = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required_role: requiredRole,
        user_role: req.user.role
      });
    }

    next();
  };
};
