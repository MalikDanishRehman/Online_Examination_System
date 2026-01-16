const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key'; // Use an environment variable for production

// Function to generate JWT token after login
const generateToken = (user) => {
    const payload = {
        userId: user.UserID,
        role: user.Role
    };

    // Generate JWT with expiration of 1 hour
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '1h' });
};

// Middleware to authenticate and verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }

        req.user = user;  // Attach user info to the request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = {
    generateToken,
    authenticateToken
};
