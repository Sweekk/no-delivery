const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.json());

// Routes
app.use('/api/orders', require('./routes/orders'));
app.use('/api/picker', require('./routes/picker'));
app.use('/api/substitution', require('./routes/substitution'));
app.use('/api/dispatch', require('./routes/dispatch'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
