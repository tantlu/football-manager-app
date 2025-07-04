// File: index.js

// Import các thư viện cần thiết
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Khởi tạo Express app và Prisma Client
const app = express();
const prisma = new PrismaClient();

// Sử dụng các middleware
app.use(cors()); // Cho phép các request từ bên ngoài
app.use(express.json()); // Giúp server đọc được dữ liệu JSON từ request

// Khai báo các routes
const authRoutes = require('./routes/auth');
const seasonRoutes = require('./routes/seasons');
const squadRoutes = require('./routes/squads');
const storyRoutes = require('./routes/stories');

app.use('/api/auth', authRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/stories', storyRoutes);


// Route thử nghiệm
app.get('/', (req, res) => {
  res.send('Football App API is running!');
});

// Lấy PORT từ file .env hoặc mặc định là 3001
const PORT = process.env.PORT || 3001;

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});