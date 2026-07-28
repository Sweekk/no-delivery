const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/orders', require('./routes/orders'));
app.use('/api/picker', require('./routes/picker'));
app.use('/api/substitution', require('./routes/substitution'));
app.use('/api/dispatch', require('./routes/dispatch'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
