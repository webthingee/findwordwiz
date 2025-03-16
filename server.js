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
    
    // Return the word's position information
    return {
        success: true,
        start: [row, col],
        end: [row + (dRow * (wordLength - 1)), col + (dCol * (wordLength - 1))],
        direction: [dRow, dCol]
    };
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
        
        const result = canPlaceWord(gridCopy, word, row, col, direction[0], direction[1]);
        if (result && result.success) {
            // If placement was successful, update the real grid
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    grid[i][j] = gridCopy[i][j];
                }
            }
            return {
                placed: true,
                position: {
                    word,
                    start: result.start,
                    end: result.end,
                    direction: result.direction
                }
            };
        }
    }
    
    return { placed: false };
}

function generateWordSearch(words) {
    // Sort words by length (longest first) to improve placement success
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    const grid = createEmptyGrid();
    const placedWords = [];
    const wordPositions = [];
    
    // Try to place each word
    for (const word of sortedWords) {
        const result = placeWord(grid, word);
        if (result.placed) {
            placedWords.push(word);
            wordPositions.push(result.position);
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
        placedWords: placedWords,
        wordPositions: wordPositions
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

// Function to read and cache templates
const templates = {
    puzzle: null,
    solution: null
};

function loadTemplates() {
    try {
        templates.puzzle = fs.readFileSync(path.join(__dirname, 'public', 'templates', 'puzzle.html'), 'utf8');
        templates.solution = fs.readFileSync(path.join(__dirname, 'public', 'templates', 'solution.html'), 'utf8');
        console.log('Templates loaded successfully');
    } catch (error) {
        console.error('Error loading templates:', error);
        process.exit(1);
    }
}

// Load templates on startup
loadTemplates();

function generatePuzzleHTML(words, grid, solutionUrl, backgroundUrl = null) {
    const gridCells = grid.map(letter => `<div class="cell">${letter}</div>`).join('');
    const wordList = words.map(word => `<li>${word}</li>`).join('');
    
    let html = templates.puzzle
        .replace('{{GRID_CELLS}}', gridCells)
        .replace('{{WORD_LIST}}', wordList)
        .replace('{{SOLUTION_URL}}', solutionUrl);
    
    if (backgroundUrl) {
        html = html.replace(
            /background-image: url\('[^']*'\);/,
            `background-image: url('${backgroundUrl}');`
        );
    }
    
    return html;
}

function generateSolutionHTML(words, grid, wordPositions, puzzlePath, backgroundUrl = null) {
    const gridCells = grid.map((letter, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        let isHighlighted = false;
        
        // Check if this cell is part of any word
        if (Array.isArray(wordPositions)) {
            for (const pos of wordPositions) {
                if (!pos || !pos.start || !pos.end || !pos.direction) continue;
                
                const { start, end, direction } = pos;
                const wordLength = Math.max(
                    Math.abs(end[0] - start[0]),
                    Math.abs(end[1] - start[1])
                ) + 1;
                
                // Check if current cell is part of this word
                for (let step = 0; step < wordLength; step++) {
                    const checkRow = start[0] + (direction[0] * step);
                    const checkCol = start[1] + (direction[1] * step);
                    if (checkRow === row && checkCol === col) {
                        isHighlighted = true;
                        break;
                    }
                }
            }
        }
        
        return `<div class="cell${isHighlighted ? ' highlighted' : ''}">${letter}</div>`;
    }).join('');
    
    const wordList = words.map(word => `<li>${word}</li>`).join('');
    
    let html = templates.solution
        .replace('{{GRID_CELLS}}', gridCells)
        .replace('{{WORD_LIST}}', wordList)
        .replace('{{PUZZLE_URL}}', puzzlePath);
    
    if (backgroundUrl) {
        html = html.replace(
            'background-image: url(\'/images/test.jpg\');',
            `background-image: url('${backgroundUrl}');`
        );
    }
    
    return html;
}

// Helper function to clean URLs
function cleanUrl(url) {
    return url.replace(/;/g, '');
}

// API endpoint to generate word search
app.post('/api/generate', (req, res) => {
    try {
        const { words, grid, openInBrowser = false } = req.body;
        
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

        // Generate unique base filename
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .replace('Z', '');
        const baseFilename = `puzzle_${timestamp}`;
        
        // Generate both puzzle and solution files
        const puzzleFilename = `${baseFilename}.html`;
        const solutionFilename = `${baseFilename}_solution.html`;
        
        const puzzleFilepath = path.join(generatedDir, puzzleFilename);
        const solutionFilepath = path.join(generatedDir, solutionFilename);

        // Create URLs for both files
        const puzzlePath = `/generated/${puzzleFilename}`;
        const solutionPath = `/generated/${solutionFilename}`;
        const baseUrl = `http://${req.get('host')}`;
        const puzzleUrl = cleanUrl(`${baseUrl}${puzzlePath}`);
        const solutionUrl = cleanUrl(`${baseUrl}${solutionPath}`);

        // Debug URL generation
        const debugUrls = {
            host: req.get('host'),
            baseUrl: cleanUrl(baseUrl),
            puzzlePath,
            solutionPath,
            puzzleUrl,
            solutionUrl
        };
        console.log('URL Generation Debug:', JSON.stringify(debugUrls));

        // Generate and save both HTML files
        const puzzleHtml = generatePuzzleHTML(processedWords, processedGrid, solutionUrl, null);
        const solutionHtml = generateSolutionHTML(processedWords, processedGrid, [], `..${puzzlePath}`, null);
        
        fs.writeFileSync(puzzleFilepath, puzzleHtml);
        fs.writeFileSync(solutionFilepath, solutionHtml);

        // Open in browser if requested
        if (openInBrowser) {
            openUrlInBrowser(puzzleUrl);
        }

        // Log successful response
        console.log('Generated puzzle:', JSON.stringify({
            timestamp: new Date().toISOString(),
            puzzleFilename,
            solutionFilename,
            puzzleUrl,
            solutionUrl
        }));

        // Return both URLs
        return res.json({
            words: processedWords,
            grid: processedGrid,
            puzzleUrl: puzzlePath,
            solutionUrl: solutionPath,
            fullPuzzleUrl: puzzleUrl,
            fullSolutionUrl: solutionUrl
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

// Function to safely open URL in browser
async function openUrlInBrowser(url) {
    try {
        const open = await import('open');
        await open.default(url);
        console.log('Opened in browser:', url);
    } catch (error) {
        console.error('Failed to open in browser:', error);
    }
}

// New endpoint to generate word search from words only
app.post('/api/generate/auto', async (req, res) => {
    try {
        const { words, openInBrowser = false, backgroundUrl = null } = req.body;
        const GRID_SIZE = 10;
        
        // Log incoming request
        console.log('Received auto-generate request:', {
            timestamp: new Date().toISOString(),
            words,
            openInBrowser,
            backgroundUrl
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
        
        // Generate the word search with positions
        const { grid, placedWords, wordPositions } = generateWordSearch(processedWords);
        
        // Generate unique base filename
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .replace('Z', '');
        const baseFilename = `puzzle_${timestamp}`;
        
        // Generate both puzzle and solution files
        const puzzleFilename = `${baseFilename}.html`;
        const solutionFilename = `${baseFilename}_solution.html`;
        
        const puzzleFilepath = path.join(generatedDir, puzzleFilename);
        const solutionFilepath = path.join(generatedDir, solutionFilename);

        // Create URLs for both files
        const puzzlePath = `/generated/${puzzleFilename}`;
        const solutionPath = `/generated/${solutionFilename}`;
        const baseUrl = `http://${req.get('host')}`;
        const puzzleUrl = cleanUrl(`${baseUrl}${puzzlePath}`);
        const solutionUrl = cleanUrl(`${baseUrl}${solutionPath}`);

        // Debug URL generation
        const debugUrls = {
            host: req.get('host'),
            baseUrl: cleanUrl(baseUrl),
            puzzlePath,
            solutionPath,
            puzzleUrl,
            solutionUrl
        };
        console.log('URL Generation Debug:', JSON.stringify(debugUrls));

        // Generate and save both HTML files with background if provided
        const puzzleHtml = generatePuzzleHTML(placedWords, grid, solutionUrl, backgroundUrl);
        const solutionHtml = generateSolutionHTML(placedWords, grid, wordPositions, `..${puzzlePath}`, backgroundUrl);
        
        fs.writeFileSync(puzzleFilepath, puzzleHtml);
        fs.writeFileSync(solutionFilepath, solutionHtml);

        // Open in browser if requested
        if (openInBrowser) {
            await openUrlInBrowser(puzzleUrl);
        }

        // Log successful response
        console.log('Generated auto puzzle:', JSON.stringify({
            timestamp: new Date().toISOString(),
            puzzleFilename,
            solutionFilename,
            puzzleUrl,
            solutionUrl,
            placedWords,
            openedInBrowser: openInBrowser
        }));

        // Return the response
        return res.json({
            words: placedWords,
            grid: grid,
            puzzleUrl: puzzlePath,
            solutionUrl: solutionPath,
            fullPuzzleUrl: puzzleUrl,
            fullSolutionUrl: solutionUrl,
            notPlaced: processedWords.filter(w => !placedWords.includes(w))
        });
    } catch (error) {
        console.error('Error in auto-generate:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ 
            error: "Failed to generate word search",
            details: error.message
        });
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