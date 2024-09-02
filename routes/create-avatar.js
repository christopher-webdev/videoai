function createAvatar(req, res) {
    try {
        console.log('🚀 ~ router.post ~ req:', req.files);

        res.status(201).json({ success: true, data: {} });
    } catch (error) {
        console.log('🚀 ~ router.post ~ error:', error);
    }
}

module.exports.createAvatar = createAvatar;
