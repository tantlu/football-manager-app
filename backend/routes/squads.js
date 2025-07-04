// File: backend/routes/squads.js (Đã sửa lỗi bảo mật)

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { parseHtmlFile } = require('../utils/parser');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Hàm kiểm tra quyền sở hữu mùa giải
const checkSeasonOwnership = async (res, seasonId, userId) => {
    const season = await prisma.season.findFirst({
        where: {
            id: parseInt(seasonId),
            userId: userId,
        },
    });
    if (!season) {
        res.status(404).json({ message: "Season not found or you do not have permission." });
        return false;
    }
    return true;
};

// Lấy dữ liệu đội hình của một mùa giải: GET /api/squads/:seasonId
router.get('/:seasonId', authMiddleware, async (req, res) => {
    const { seasonId } = req.params;
    const userId = req.userData.userId;

    try {
        // <-- THÊM MỚI: Kiểm tra quyền sở hữu trước khi hành động -->
        const isOwner = await checkSeasonOwnership(res, seasonId, userId);
        if (!isOwner) return;

        const players = await prisma.player.findMany({
            where: { seasonId: parseInt(seasonId) },
            orderBy: { ca: 'desc' }
        });
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch squad data.", error: error.message });
    }
});


// Upload đội hình: POST /api/squads/upload/:seasonId
router.post('/upload/:seasonId', authMiddleware, upload.single('squadFile'), async (req, res) => {
    const { seasonId } = req.params;
    const userId = req.userData.userId;

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // <-- THÊM MỚI: Kiểm tra quyền sở hữu trước khi hành động -->
        const isOwner = await checkSeasonOwnership(res, seasonId, userId);
        if (!isOwner) return;

        const playersData = parseHtmlFile(req.file.buffer);
        const playersToCreate = playersData.map(player => ({
            ...player,
            seasonId: parseInt(seasonId)
        }));

        await prisma.$transaction([
            prisma.player.deleteMany({ where: { seasonId: parseInt(seasonId) } }),
            prisma.player.createMany({ data: playersToCreate })
        ]);
        
        res.status(201).json({ message: `${playersToCreate.length} players uploaded successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to process file.", error: error.message });
    }
});

// API Xóa toàn bộ cầu thủ của một mùa giải: DELETE /api/squads/:seasonId
router.delete('/:seasonId', authMiddleware, async (req, res) => {
    const { seasonId } = req.params;
    const userId = req.userData.userId;

    try {
        // Logic kiểm tra quyền sở hữu của bạn ở đây đã rất tốt!
        const isOwner = await checkSeasonOwnership(res, seasonId, userId);
        if (!isOwner) return;

        const deleteResult = await prisma.player.deleteMany({
            where: {
                seasonId: parseInt(seasonId),
            },
        });

        res.status(200).json({ message: `Successfully deleted ${deleteResult.count} players from the squad.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete squad data.", error: error.message });
    }
});

module.exports = router;