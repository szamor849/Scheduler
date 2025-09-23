const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const fetch = require('node-fetch');

// Store received webhook data and appointments
let receivedData = [];
let appointments = [];
let clients = [];

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve the HTML page
    if (pathname === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    // Serve the scheduling page
    else if (pathname === '/schedule' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'schedule.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading schedule.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    // Serve the n8n debug page
    else if (pathname === '/n8n-debug' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'n8n-debug.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading n8n-debug.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    // Serve the test page without CSRF
    else if (pathname === '/test-no-csrf' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'test-no-csrf.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading test-no-csrf.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    // Webhook endpoint for n8n
    else if (pathname === '/webhook-test/appointment' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            let payload;
            try {
                payload = JSON.parse(body);
            } catch (e) {
                payload = body;
            }
            
            // Store the received data
            receivedData.unshift({
                timestamp: new Date().toISOString(),
                payload: payload
            });
            
            // Keep only the last 20 payloads
            if (receivedData.length > 20) {
                receivedData = receivedData.slice(0, 20);
            }
            
            // Broadcast to all connected clients
            broadcast(JSON.stringify(payload));
            
            // Send response
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ status: 'success', message: 'Webhook received' }));
        });
    }
    // Handle appointment submissions
    else if (pathname === '/submit-appointment' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const appointmentData = JSON.parse(body);
                
                console.log('Received appointment data:', JSON.stringify(appointmentData, null, 2));
                
                // Store the appointment
                appointments.push({
                    ...appointmentData,
                    timestamp: new Date().toISOString(),
                    id: Date.now().toString()
                });
                
                // Log the appointment
                console.log('New appointment received:', appointmentData);
                
                // Send to n8n webhook
                sendToN8N(appointmentData);
                
                // Send response
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ 
                    status: 'success', 
                    message: 'Appointment received successfully',
                    appointmentId: Date.now().toString()
                }));
                
            } catch (error) {
                console.error('Error parsing appointment data:', error);
                res.writeHead(400, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ 
                    status: 'error', 
                    message: 'Invalid data format'
                }));
            }
        });
    }
    // Status endpoint
    else if (pathname === '/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
    }
    // Events endpoint for Server-Sent Events
    else if (pathname === '/events' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        
        // Send initial message to confirm connection
        res.write('data: ' + JSON.stringify({ message: 'Connected to webhook events' }) + '\n\n');
        
        // Store the response object to send events later
        clients.push(res);
        
        // Remove client when connection closes
        req.on('close', () => {
            clients = clients.filter(client => client !== res);
        });
    }
    // Get all received payloads
    else if (pathname === '/payloads' && req.method === 'GET') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(receivedData));
    }
    // Get all appointments
    else if (pathname === '/appointments' && req.method === 'GET') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(appointments));
    }
    // View appointments page
    else if (pathname === '/view-appointments' && req.method === 'GET') {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Appointments</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .appointment { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    h1 { color: #2a7de1; }
                    a { color: #2a7de1; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <h1>Received Appointments</h1>
                <a href="/schedule">← Back to scheduling</a>
                <div id="appointments">
        `;
        
        appointments.forEach(appt => {
            html += `
                <div class="appointment">
                    <h3>${appt.fullName} - ${appt.date} ${appt.time}</h3>
                    <p><strong>Hospital:</strong> ${appt.hospital}</p>
                    <p><strong>Doctor:</strong> ${appt.doctor}</p>
                    <p><strong>Phone:</strong> ${appt.phone}</p>
                    <p><strong>Email:</strong> ${appt.email}</p>
                    <p><strong>Notes:</strong> ${appt.notes || 'None'}</p>
                    <p><small>Received: ${new Date(appt.timestamp).toLocaleString()}</small></p>
                </div>
            `;
        });
        
        html += `
                </div>
            </body>
            </html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    // Handle undefined routes
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Function to broadcast messages to all connected clients
function broadcast(message) {
    clients.forEach(client => {
        client.write('data: ' + message + '\n\n');
    });
}

// Function to send appointment data to n8n
async function sendToN8N(appointmentData) {
    try {
        // Transform the data to match what n8n expects
        const transformedData = {
            fullName: appointmentData.fullName,
            email: appointmentData.email,
            phone: appointmentData.phone,
            doctor: appointmentData.doctor,
            date: appointmentData.date,
            time: appointmentData.time,
            notes: appointmentData.notes || '',
            hospital: appointmentData.hospital
            // REMOVED CSRF TOKEN
        };

        console.log('Sending to n8n:', JSON.stringify(transformedData, null, 2));

        // USE ENVIRONMENT VARIABLE FOR N8N URL - CRITICAL FOR DEPLOYMENT
        const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
        const response = await fetch(`${n8nUrl}/webhook-test/appointment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transformedData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Appointment data sent to n8n successfully:', result);
        } else {
            console.error('Failed to send data to n8n:', response.status);
        }
    } catch (error) {
        console.error('Error sending to n8n:', error);
    }
}

// Start the server - USE RENDER'S PORT ENVIRONMENT VARIABLE
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
    
    // Check if we're running on Render
    const isRender = process.env.RENDER || false;
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    
    if (isRender && renderUrl) {
        console.log(`Production server running on: ${renderUrl}`);
        console.log(`- Main page: ${renderUrl}/`);
        console.log(`- Appointment form: ${renderUrl}/schedule`);
    } else {
        // Local development
        console.log(`Local development server running:`);
        console.log(`- Main page: http://localhost:${PORT}/`);
        console.log(`- Appointment form: http://localhost:${PORT}/schedule`);
        console.log(`- Webhook endpoint: http://localhost:${PORT}/webhook-test/appointment`);
        console.log('Press Ctrl+C to stop the server');
    }
});

// Add error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error('Server error:', error);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});