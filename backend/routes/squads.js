// File: routes/squads.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { parseHtmlFile } = require('../utils/parser');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() }); // Lưu file vào bộ nhớ tạm

// Lấy dữ liệu đội hình của một mùa giải: GET /api/squads/:seasonId
router.get('/:seasonId', authMiddleware, async (req, res) => {
    const { seasonId } = req.params;
    const players = await prisma.player.findMany({
        where: { seasonId: parseInt(seasonId) },
        orderBy: { ca: 'desc' } // Sắp xếp theo CA giảm dần
    });
    res.json(players);
});


// Upload đội hình: POST /api/squads/upload/:seasonId
router.post('/upload/:seasonId', authMiddleware, upload.single('squadFile'), async (req, res) => {
    const { seasonId } = req.params;

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Phân tích file HTML từ buffer
        const playersData = parseHtmlFile(req.file.buffer);

        // Chuẩn bị dữ liệu để thêm vào DB
        const playersToCreate = playersData.map(player => ({
            ...player,
            seasonId: parseInt(seasonId)
        }));

        // Xóa dữ liệu cũ (nếu có) và thêm dữ liệu mới
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
        // BƯỚC BẢO MẬT QUAN TRỌNG: Kiểm tra xem mùa giải này có thực sự thuộc về người dùng đang đăng nhập không
        const season = await prisma.season.findFirst({
            where: {
                id: parseInt(seasonId),
                userId: userId,
            },
        });

        // Nếu không tìm thấy mùa giải hoặc không thuộc quyền sở hữu, báo lỗi
        if (!season) {
            return res.status(404).json({ message: "Season not found or you do not have permission." });
        }

        // Nếu hợp lệ, tiến hành xóa tất cả cầu thủ thuộc mùa giải này
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