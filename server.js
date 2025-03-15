const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Ensure generated directory exists
const generatedDir = path.join(__dirname, 'public', 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

// Word search generation functions
function createEmptyGrid(size = 10) {
    return Array(size).fill().map(() => Array(size).fill(''));
}

function canPlaceWord(grid, word, row, col, dRow, dCol) {
    const size = grid.length;
    const wordLength = word.length;
    
    // First check if the word fits within bounds
    for (let i = 0; i < wordLength; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        
        // Check bounds
        if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
            return false;
        }
    }

    // Now check if we can place the word
    // We'll track positions we need to fill (where there isn't already a matching letter)
    const positionsToFill = [];
    
    for (let i = 0; i < wordLength; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        const currentCell = grid[newRow][newCol];
        
        // If cell is empty or matches the letter we want to place, it's valid
        if (currentCell === '' || currentCell === word[i]) {
            if (currentCell === '') {
                positionsToFill.push([newRow, newCol, word[i]]);
            }
            // If the letter matches, we don't need to do anything
            continue;
        } else {
            // If there's a different letter here, we can't place the word
            return false;
        }
    }
    
    // If we get here, we can place the word
    // Fill in all the new positions
    positionsToFill.forEach(([r, c, letter]) => {
        grid[r][c] = letter;
    });
    
    return true;
}

function placeWord(grid, word) {
    const size = grid.length;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],  // Up-left, Up, Up-right
        [0, -1],           [0, 1],    // Left, Right
        [1, -1],  [1, 0],  [1, 1]     // Down-left, Down, Down-right
    ];
    
    // Try 100 random positions (increased from 50 for better chances)
    for (let attempt = 0; attempt < 100; attempt++) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // Create a copy of the grid for this attempt
        const gridCopy = grid.map(row => [...row]);
        
        if (canPlaceWord(gridCopy, word, row, col, direction[0], direction[1])) {
            // If placement was successful, update the real grid
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    grid[i][j] = gridCopy[i][j];
                }
            }
            return true;
        }
    }
    
    return false;
}

function generateWordSearch(words) {
    // Sort words by length (longest first) to improve placement success
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    const grid = createEmptyGrid();
    const placedWords = [];
    
    // Try to place each word
    for (const word of sortedWords) {
        if (placeWord(grid, word)) {
            placedWords.push(word);
        }
    }
    
    // Fill empty spaces with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid.length; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
    
    // Convert 2D grid to 1D array
    const flatGrid = grid.flat();
    
    return {
        grid: flatGrid,
        placedWords: placedWords
    };
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

function generateHTML(words, grid) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Word Search Puzzle</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center;
            padding: 20px;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(10, 40px); 
            grid-template-rows: repeat(10, 40px);
            justify-content: center; 
            gap: 2px; 
            margin: 20px auto;
        }
        .cell { 
            width: 40px; 
            height: 40px; 
            border: 1px solid #444; 
            text-align: center; 
            font-size: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .clues {
            text-align: left;
            display: inline-block;
            padding: 10px;
            border-radius: 8px;
            background: #f5f5f5;
            margin: 20px;
        }
        @media print {
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <h1>Word Search Puzzle</h1>
    <div class="grid">
        ${grid.map(letter => `<div class="cell">${letter}</div>`).join('')}
    </div>
    <div class="clues">
        <h3>Find these words:</h3>
        <ul>
            ${words.map(word => `<li>${word}</li>`).join('')}
        </ul>
    </div>
    <button class="no-print" onclick="window.print()">Print</button>
    <p class="no-print"><a href="/">Create another puzzle</a></p>
</body>
</html>`;
}

// API endpoint to generate word search
app.post('/api/generate', (req, res) => {
    try {
        const { words, grid } = req.body;
        
        // Log incoming request for debugging
        console.log('Received request:', {
            timestamp: new Date().toISOString(),
            body: req.body
        });
        
        // Validate input
        if (!Array.isArray(words) || !Array.isArray(grid)) {
            return res.status(400).json({ error: "Both inputs must be JSON arrays" });
        }
        
        if (grid.length !== 100) {
            return res.status(400).json({ 
                error: "Grid must contain exactly 100 letters",
                provided: grid.length
            });
        }
        
        if (words.length === 0) {
            return res.status(400).json({ error: "Please enter at least one word" });
        }
        
        if (words.length > 10) {
            return res.status(400).json({ error: "Maximum 10 words allowed" });
        }
        
        if (!words.every(word => typeof word === 'string')) {
            return res.status(400).json({ error: "All words must be strings" });
        }
        
        if (!grid.every(letter => typeof letter === 'string' && letter.length === 1)) {
            return res.status(400).json({ error: "Grid must contain single letters" });
        }

        // Process the data
        const processedWords = words.map(word => word.toUpperCase());
        const processedGrid = grid.map(letter => letter.toUpperCase());

        // Generate unique filename using date and time
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .replace('Z', '');
        const filename = `puzzle_${timestamp}.html`;
        const filepath = path.join(generatedDir, filename);

        // Generate and save HTML file
        const html = generateHTML(processedWords, processedGrid);
        fs.writeFileSync(filepath, html);

        // Create URLs for the generated puzzle
        const puzzlePath = `/generated/${filename}`;
        const baseUrl = `http://${req.get('host')}`;
        const fullUrl = `${baseUrl}${puzzlePath}`;

        // Log successful response
        console.log('Generated puzzle:', {
            timestamp: new Date().toISOString(),
            filename,
            url: fullUrl
        });

        // Return both the processed data and URLs
        return res.json({
            words: processedWords,
            grid: processedGrid,
            puzzleUrl: puzzlePath,
            fullUrl: fullUrl
        });
    } catch (error) {
        // Log error for debugging
        console.error('Error processing request:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        });
        return res.status(400).json({ error: "Invalid JSON format" });
    }
});

// New endpoint to generate word search from words only
app.post('/api/generate/auto', (req, res) => {
    try {
        const { words } = req.body;
        const GRID_SIZE = 10;
        
        // Log incoming request
        console.log('Received auto-generate request:', {
            timestamp: new Date().toISOString(),
            words
        });
        
        // Validate input
        if (!Array.isArray(words)) {
            return res.status(400).json({ error: "Words must be an array" });
        }
        
        if (words.length === 0) {
            return res.status(400).json({ error: "Please enter at least one word" });
        }
        
        if (words.length > 10) {
            return res.status(400).json({ error: "Maximum 10 words allowed" });
        }
        
        if (!words.every(word => typeof word === 'string')) {
            return res.status(400).json({ error: "All words must be strings" });
        }

        // Process words and check lengths
        const processedWords = words.map(word => word.toUpperCase());
        const tooLongWords = processedWords.filter(word => word.length > GRID_SIZE);
        
        if (tooLongWords.length > 0) {
            return res.status(400).json({ 
                error: "Some words are too long for the 10x10 grid",
                maxLength: GRID_SIZE,
                tooLongWords: tooLongWords
            });
        }
        
        // Generate the word search
        const { grid, placedWords } = generateWordSearch(processedWords);
        
        // Generate unique filename
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .replace('Z', '');
        const filename = `puzzle_${timestamp}.html`;
        const filepath = path.join(generatedDir, filename);

        // Generate and save HTML file
        const html = generateHTML(placedWords, grid);
        fs.writeFileSync(filepath, html);

        // Create URLs for the generated puzzle
        const puzzlePath = `/generated/${filename}`;
        const baseUrl = `http://${req.get('host')}`;
        const fullUrl = `${baseUrl}${puzzlePath}`;

        // Log successful response
        console.log('Generated auto puzzle:', {
            timestamp: new Date().toISOString(),
            filename,
            url: fullUrl,
            placedWords
        });

        // Return the response
        return res.json({
            words: placedWords,
            grid: grid,
            puzzleUrl: puzzlePath,
            fullUrl: fullUrl,
            notPlaced: processedWords.filter(w => !placedWords.includes(w))
        });
    } catch (error) {
        console.error('Error in auto-generate:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        });
        return res.status(400).json({ error: "Failed to generate word search" });
    }
});

// Debug endpoint to get sample data
app.get('/api/sample', (req, res) => {
    // Generate a 100-letter grid
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const grid = Array(100).fill().map(() => 
        alphabet[Math.floor(Math.random() * alphabet.length)]
    );
    
    const sampleData = {
        words: ["REMOTE", "BINGE", "EPISODE"],
        grid: grid
    };
    
    res.json(sampleData);
});

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
const server = app.listen(port, host, () => {
    console.log(`Word Search API running at http://${host}:${port}`);
    console.log('Server configuration:', {
        host,
        port,
        timestamp: new Date().toISOString()
    });
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