// File: backend/routes/comments.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// API lấy tất cả bình luận của một bài viết
router.get('/:storyId', async (req, res) => {
    const { storyId } = req.params;
    const comments = await prisma.comment.findMany({
        where: { storyId: parseInt(storyId) },
        orderBy: { createdAt: 'asc' },
        include: {
            author: { // Lấy cả username của người bình luận
                select: { username: true }
            }
        }
    });
    res.json(comments);
});

// API đăng một bình luận mới
router.post('/:storyId', authMiddleware, async (req, res) => {
    const { storyId } = req.params;
    const { content } = req.body;
    const authorId = req.userData.userId;

    if (!content) {
        return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    const newComment = await prisma.comment.create({
        data: {
            content,
            storyId: parseInt(storyId),
            authorId: authorId
        }
    });

    res.status(201).json(newComment);
});

module.exports = router;