// File: backend/routes/players.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// API lấy chi tiết một cầu thủ bằng ID
router.get('/:playerId', async (req, res) => {
    const { playerId } = req.params;
    try {
        const player = await prisma.player.findUnique({
            where: { id: parseInt(playerId) }
        });
        if (!player) {
            return res.status(404).json({ message: "Player not found." });
        }
        res.json(player);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch player details." });
    }
});

module.exports = router;