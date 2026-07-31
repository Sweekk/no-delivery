const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const pickerRoutes = require('./routes/picker');
const deliveryRoutes = require('./routes/delivery');
const ordersRoutes = require('./routes/orders');
const substitutionRoutes = require('./routes/substitution');
const dispatchRoutes = require('./routes/dispatch');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', require('./routes/customerOrder'));
app.use('/api/delivery', deliveryRoutes);
app.use('/api/orders', ordersRoutes);

// Picker routes mounted for all client route patterns specified in requirements
app.use('/api/picker', pickerRoutes);
app.use('/api/order', pickerRoutes);
app.use('/api/item', pickerRoutes);
app.use('/order', pickerRoutes);
app.use('/item', pickerRoutes);

// Additional domain routes
app.use('/api/substitution', substitutionRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`QuickFix Grocery Backend server running on port ${PORT}`);
});
