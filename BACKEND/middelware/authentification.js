import jwt from 'jsonwebtoken';

export async function authentification(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header is missing' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token is missing' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // Handle different JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token format or signature' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({ message: 'Token not active yet' });
        }
        return res.status(401).json({ message: 'Invalid or malformed token' });
    }
}
export function role(...roles) {
    return (req, res, next) => {
        // Skip role check for demo mode (unauthenticated public access)
        if (req.query.isDemo === 'true') {
            return next();
        }
        // Super-admin has access to everything
        if (req.user && req.user.role === 'super-admin') {
            return next();
        }
        // For authenticated users, check role
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient rights' });
        }
        next();
    }
}