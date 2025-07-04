// File: backend/routes/stories.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// API lấy câu chuyện của một mùa giải
router.get('/:seasonId', authMiddleware, async (req, res) => {
    const { seasonId } = req.params;
    const story = await prisma.careerStory.findUnique({
        where: { seasonId: parseInt(seasonId) }
    });
    res.json(story);
});

// API tạo/cập nhật câu chuyện cho một mùa giải
router.post('/:seasonId', authMiddleware, async (req, res) => {
    const { seasonId } = req.params;
    const { title, content } = req.body;
    const userId = req.userData.userId;

    // Kiểm tra xem mùa giải có thuộc về user không
    const season = await prisma.season.findFirst({
        where: { id: parseInt(seasonId), userId: userId }
    });
    if (!season) {
        return res.status(403).json({ message: "Forbidden" });
    }

    // Dùng upsert: nếu đã có story thì update, chưa có thì tạo mới
    const story = await prisma.careerStory.upsert({
        where: { seasonId: parseInt(seasonId) },
        update: { title, content },
        create: { title, content, seasonId: parseInt(seasonId) }
    });

    res.json(story);
});

// API mới: Lấy tất cả các bài viết để hiển thị công khai
router.get('/public/feed', async (req, res) => {
    try {
        const stories = await prisma.careerStory.findMany({
            orderBy: {
                updatedAt: 'desc', // Sắp xếp theo bài mới nhất
            },
            include: {
                season: {
                    select: {
                        seasonName: true,
                        user: {
                            select: {
                                username: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch public feed.' });
    }
});

// API MỚI: Lấy chi tiết một câu chuyện và đội hình liên quan
router.get('/details/:seasonId', async (req, res) => {
    const { seasonId } = req.params;
    try {
        const story = await prisma.careerStory.findUnique({
            where: { seasonId: parseInt(seasonId) },
            include: {
                season: {
                    select: {
                        seasonName: true,
                        user: {
                            select: { id: true , username: true }
                        }
                    }
                }
            }
        });

        if (!story) {
            return res.status(404).json({ message: "Story not found." });
        }

        const players = await prisma.player.findMany({
            where: { seasonId: parseInt(seasonId) },
            orderBy: { ca: 'desc' }
        });

        res.json({ story, players });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch story details." });
    }
});
// API CẬP NHẬT (EDIT) một bài viết
router.put('/:storyId', authMiddleware, async (req, res) => {
    const { storyId } = req.params;
    const { title, content } = req.body;
    const userId = req.userData.userId;

    try {
        // Lấy thông tin story và season liên quan để kiểm tra quyền sở hữu
        const storyToEdit = await prisma.careerStory.findUnique({
            where: { id: parseInt(storyId) },
            include: { season: true }
        });

        // BƯỚC BẢO MẬT: Nếu story không tồn tại hoặc user ID của season không khớp, từ chối quyền
        if (!storyToEdit || storyToEdit.season.userId !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only edit your own stories." });
        }

        // Nếu hợp lệ, tiến hành cập nhật
        const updatedStory = await prisma.careerStory.update({
            where: { id: parseInt(storyId) },
            data: { title, content }
        });

        res.json(updatedStory);
    } catch (error) {
        res.status(500).json({ message: "Failed to update story.", error: error.message });
    }
});

module.exports = router;