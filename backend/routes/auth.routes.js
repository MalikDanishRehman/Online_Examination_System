const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { sql, getPool } = require('../db');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    try {
        const pool = await getPool();

        // Only fetch user by email
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT user_id, name, email, password_hash, role
                FROM users
                WHERE email = @email
            `);

        if (!result.recordset.length) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.recordset[0];

        // Password check (bcrypt OR plaintext seed)
        let passwordMatch = false;

        if (
            user.password_hash &&
            typeof user.password_hash === 'string' &&
            user.password_hash.startsWith('$2')
        ) {
            passwordMatch = await bcrypt.compare(password, user.password_hash);
        } else {
            // plaintext fallback for seeded users
            passwordMatch = password === user.password_hash;
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error('LOGIN ERROR:', err);
        return res.status(500).json({ message: 'Login failed' });
    }
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10); // Hash the password
        const pool = await getPool();

        // Insert user as examinee (default role for registration)
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('pass', sql.NVarChar, hash)
            .query(`
                INSERT INTO users (name, email, password_hash, role)
                VALUES (@name, @email, @pass, 'examinee')
            `);

        return res.json({ success: true });

    } catch (err) {
        console.error('REGISTER ERROR:', err);
        return res.status(500).json({ message: 'Register failed' });
    }
});

module.exports = router;
