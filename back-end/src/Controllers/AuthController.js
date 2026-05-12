import bcrypt from 'bcrypt';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/session.js';

const ACESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;//14 ngay

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;
        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: 'Không thể thiếu username,password,email,firstName,lastName' });
        }
        // Kiểm tra xem người dùng đã tồn tại chưa
        const duplicate = await User.findOne({ username });
        if (duplicate) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);//saltRounds = 10
        //tao user moi
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`,
        });

        //return user moi tao
        return res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const signIn = async (req, res) => {
    try {
        // Lấy thông tin đăng nhập từ yêu cầu
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Không thể thiếu username và password' });
        }
        //lay hashPassword tu db de so sanh voi password nguoi dung nhap vao
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        //kiem tra password nguoi dung nhap vao voi hashPassword trong db
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        //nếu đúng thì tạo accessToken voi jwt
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACESS_TOKEN_TTL }
        );
        //tao refreshToken
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //tao session luu refreshToken
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });
        //tra ve refreshToken trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',//back-end va front-end deploy rieng
            maxAge: REFRESH_TOKEN_TTL,
        });
        //tra ve accessToken trong res
        return res.status(200).json({ message: 'Login successful', accessToken });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const signOut = async (req, res) => {
    try {
        //lay refreshToken tu cookie
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(400).json({ message: 'No refresh token provided' });
        }
        //xoa refreshToken trong session
        await Session.deleteOne({ refreshToken: token });

        //xoa cookie refreshToken
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        return res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};