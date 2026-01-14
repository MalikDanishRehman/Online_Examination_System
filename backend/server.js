require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/examiner', require('./routes/examiner.routes'));
app.use('/api/examinee', require('./routes/examinee.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/exam', require('./routes/exam.routes'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
