const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Ensure generated directory exists
const generatedDir = path.join(__dirname, 'public', 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API routes
app.use('/api', require('./src/api/routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack
    });
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(port, host, async () => {
    console.log(`Server running at http://${host}:${port}`);
    
    // Open browser if not in production
    if (process.env.NODE_ENV !== 'production') {
        try {
            const open = (await import('open')).default;
            await open(`http://localhost:${port}`);
        } catch (error) {
            console.log('Could not open browser automatically');
        }
    }
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
    });
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});