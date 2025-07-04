// File: routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// API Đăng ký: POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới trong database
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    // Bắt lỗi nếu username đã tồn tại
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// API Đăng nhập: POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Tìm user trong database
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Tạo JSON Web Token (JWT)
    const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET, // Thêm JWT_SECRET vào file .env
        { expiresIn: '1h' }
    );

    res.json({ message: 'Logged in successfully', token, userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

module.exports = router;