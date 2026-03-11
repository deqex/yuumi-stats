import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ') && JWT_SECRET) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      req.userId = decoded.id;
      req.username = decoded.username;
    } catch {
      
    }
  }
  next();
};
