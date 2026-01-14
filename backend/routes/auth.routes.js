const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { sql, getPool } = require('../db');

/* LOGIN */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const pool = await getPool();
    const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM users WHERE email=@email');

    if (!result.recordset.length)
        return res.json({ success: false });

    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password_hash);

    res.json({ success: match, user });
});

/* REGISTER (STUDENT ONLY) */
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const pool = await getPool();
    await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('pass', sql.VarChar, hash)
        .query(`
            INSERT INTO users (name,email,password_hash,role)
            VALUES (@name,@email,@pass,'examinee')
        `);

    res.json({ success: true });
});

module.exports = router;
