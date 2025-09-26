const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'MedSchedule Pro Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is working correctly!',
        endpoints: {
            health: '/health',
            appointment: '/webhook-test/appointment (POST)'
        }
    });
});

// Simple appointment endpoint
app.post('/webhook-test/appointment', (req, res) => {
    console.log('Received appointment:', req.body);
    res.status(201).json({
        success: true,
        message: 'Appointment received successfully!',
        data: req.body
    });
});

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
