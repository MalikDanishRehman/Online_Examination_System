//console.log('auth.routes.js LOADED');

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { sql, getPool } = require('../db');

router.post('/login', async (req, res) => {
    //dbg.log('LOGIN ROUTE HIT', req.body);

    const { email, password } = req.body;

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email=@email');

        if (!result.recordset.length) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.recordset[0];

        // PATCH FIX (plaintext + bcrypt support)
        let passwordMatch = false;

        if (user.password_hash.startsWith('$2')) {
            // bcrypt hash
            passwordMatch = await bcrypt.compare(password, user.password_hash);
        } else {
            // plaintext password (seed data)
            passwordMatch = password === user.password_hash;
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // JWT generation
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
    //console.log('REGISTER ROUTE HIT', req.body);

    const { name, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);
        const pool = await getPool();

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
