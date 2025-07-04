// File: routes/seasons.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Lấy tất cả mùa giải của user: GET /api/seasons
router.get('/', authMiddleware, async (req, res) => {
  const seasons = await prisma.season.findMany({
    where: { userId: req.userData.userId },
  });
  res.json(seasons);
});

// Tạo mùa giải mới: POST /api/seasons
router.post('/', authMiddleware, async (req, res) => {
    const { seasonName } = req.body;
    if(!seasonName) {
        return res.status(400).json({ message: "Season name is required" });
    }
    const newSeason = await prisma.season.create({
        data: {
            seasonName,
            userId: req.userData.userId
        }
    });
    res.status(201).json(newSeason);
});


module.exports = router;