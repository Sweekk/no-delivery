require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customer', require('./routes/customerOrder'));
app.use('/api/picker', require('./routes/picker'));
app.use('/api/substitution', require('./routes/substitution'));
app.use('/api/dispatch', require('./routes/dispatch'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/driver', require('./routes/driver'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
