const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Store appointments in memory (for demo - will reset on server restart)
let appointments = [];

// Webhook endpoint that matches your HTML form
app.post('/webhook-test/appointment', (req, res) => {
    try {
        console.log('📅 Received appointment request:', req.body);
        
        const { fullName, email, phone, doctor, date, time, hospital, notes } = req.body;
        
        // Validate required fields
        if (!fullName || !email || !phone || !doctor || !date || !time || !hospital) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Create appointment object
        const appointment = {
            id: Date.now(),
            fullName,
            email,
            phone,
            doctor,
            date,
            time,
            hospital,
            notes: notes || 'None',
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        // Store the appointment
        appointments.push(appointment);
        
        console.log('✅ Appointment stored:', appointment.id);
        
        // Send success response
        res.status(201).json({
            success: true,
            message: 'Appointment request received successfully!',
            appointmentId: appointment.id,
            data: appointment
        });
        
    } catch (error) {
        console.error('❌ Error processing appointment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process appointment request'
        });
    }
});

// Endpoint to view all appointments (for testing)
app.get('/api/appointments', (req, res) => {
    res.json({
        success: true,
        count: appointments.length,
        appointments: appointments
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'MedSchedule Pro Server',
        timestamp: new Date().toISOString()
    });
});

// Serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 MedSchedule Pro Server running on port ${PORT}`);
    console.log(`📝 Webhook endpoint: http://localhost:${PORT}/webhook-test/appointment`);
    console.log(`👥 API endpoint: http://localhost:${PORT}/api/appointments`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});
