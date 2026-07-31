const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const pickerRoutes = require('./routes/picker');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Picker routes mounted for all client route patterns specified in requirements
app.use('/api/picker', pickerRoutes);
app.use('/api/order', pickerRoutes);
app.use('/api/orders', pickerRoutes);
app.use('/api/item', pickerRoutes);
app.use('/order', pickerRoutes);
app.use('/item', pickerRoutes);

// Additional domain routes
app.use('/api/substitution', require('./routes/substitution'));
app.use('/api/dispatch', require('./routes/dispatch'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

