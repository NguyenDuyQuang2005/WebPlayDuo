export const authMe = async (req, res) => {
    try {
        const user = req.user; // lay tu middleware authMiddleware
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error authenticating user:', error);
        return res.status(500).json({ message: 'Failed to authenticate user' });
    }
}