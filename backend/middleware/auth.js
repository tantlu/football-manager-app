// File: middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Lấy token từ header 'Authorization: Bearer <token>'
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gắn thông tin user vào request để các hàm sau có thể dùng
    req.userData = { userId: decodedToken.userId, username: decodedToken.username };
    
    next(); // Chuyển sang hàm xử lý tiếp theo
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed!' });
  }
};