const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Store appointments
let appointments = [];

// Endpoint for your n8n workflow (what your HTML expects)
app.post('/appointment', (req, res) => {
    try {
        console.log('📅 Received appointment for n8n:', req.body);
        
        const { fullName, email, phone, doctor, date, time, hospital, notes } = req.body;
        
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
            timestamp: new Date().toISOString()
        };
        
        appointments.push(appointment);
        
        // Send response in n8n-compatible format
        res.status(201).json({
            success: true,
            message: 'Appointment received by n8n workflow',
            data: appointment
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process appointment' });
    }
});

// Keep your existing endpoint for testing
app.post('/webhook-test/appointment', (req, res) => {
    console.log('Test webhook received:', req.body);
    res.status(201).json({ 
        success: true, 
        message: 'Test endpoint working',
        data: req.body 
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'MedSchedule Pro Server',
        appointments: appointments.length
    });
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 n8n endpoint: http://localhost:${PORT}/appointment`);
});
