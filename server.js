const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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
        
        // Get doctor details
        function getDoctorDetails(doctorId) {
            const doctors = {
                'cg-1': { name: 'Dr. Sarah Johnson', specialty: 'Cardiology' },
                'cg-2': { name: 'Dr. Michael Chen', specialty: 'Neurology' },
                'cg-3': { name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics' },
                'wm-1': { name: 'Dr. James Wilson', specialty: 'Orthopedics' },
                'wm-2': { name: 'Dr. Lisa Taylor', specialty: 'Dermatology' },
                'wm-3': { name: 'Dr. Robert Brown', specialty: 'Ophthalmology' },
                'nc-1': { name: 'Dr. Amanda White', specialty: 'General Practice' },
                'nc-2': { name: 'Dr. David Lee', specialty: 'Dentistry' },
                'nc-3': { name: 'Dr. Maria Garcia', specialty: 'Psychiatry' }
            };
            return doctors[doctorId] || { name: 'Selected Doctor', specialty: 'Medical Specialist' };
        }

        const doctorDetails = getDoctorDetails(doctor);
        
        // Create appointment object
        const appointment = {
            id: Date.now(),
            fullName,
            email,
            phone,
            doctor: doctorDetails.name,
            doctorSpecialty: doctorDetails.specialty,
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
        timestamp: new Date().toISOString(),
        appointmentsCount: appointments.length
    });
});

// Test endpoint - to verify server is working
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is working!',
        endpoint: '/webhook-test/appointment is available for POST requests'
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
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});
