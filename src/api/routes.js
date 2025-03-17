/**
 * API Routes Module
 * Contains route handlers for the API endpoints
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateWordSearch } = require('../puzzle/generator');
const { validatePuzzleRequest } = require('../puzzle/validator');
const { generatePuzzleHTML, generateSolutionHTML } = require('../templates/generator');

// Ensure generated directory exists
const generatedDir = path.join(__dirname, '../../public/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

/**
 * Generates a unique filename for a puzzle
 * @returns {string} Unique filename
 */
function generateUniqueFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `puzzle_${timestamp}.html`;
}

/**
 * Generates a unique filename for a solution
 * @param {string} puzzleFilename - The puzzle filename
 * @returns {string} Solution filename
 */
function generateSolutionFilename(puzzleFilename) {
    return puzzleFilename.replace('.html', '_solution.html');
}

// Auto-generate puzzle endpoint
router.post('/generate/auto', (req, res) => {
    const validation = validatePuzzleRequest(req.body);
    if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
    }

    const { words } = req.body;
    const puzzleData = generateWordSearch(words);

    const puzzleFilename = generateUniqueFilename();
    const solutionFilename = generateSolutionFilename(puzzleFilename);

    const puzzlePath = path.join(generatedDir, puzzleFilename);
    const solutionPath = path.join(generatedDir, solutionFilename);

    const puzzleUrl = `/generated/${puzzleFilename}`;
    const solutionUrl = `/generated/${solutionFilename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${puzzleUrl}`;

    // Generate and save puzzle HTML
    const puzzleHtml = generatePuzzleHTML({
        words: puzzleData.placedWords,
        grid: puzzleData.grid,
        wordPositions: puzzleData.wordPositions
    }, solutionUrl);
    fs.writeFileSync(puzzlePath, puzzleHtml);

    // Generate and save solution HTML
    const solutionHtml = generateSolutionHTML({
        words: puzzleData.placedWords,
        grid: puzzleData.grid,
        wordPositions: puzzleData.wordPositions
    }, puzzleUrl);
    fs.writeFileSync(solutionPath, solutionHtml);

    // Return a JSON object with the URL
    res.json({
        url: fullUrl,
        success: true
    });
});

// Manual puzzle generation endpoint
router.post('/generate', (req, res) => {
    const validation = validatePuzzleRequest(req.body);
    if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
    }

    const { words, grid } = req.body;
    const puzzleData = {
        words,
        grid,
        wordPositions: [] // Manual puzzles don't track word positions
    };

    const puzzleFilename = generateUniqueFilename();
    const solutionFilename = generateSolutionFilename(puzzleFilename);

    const puzzlePath = path.join(generatedDir, puzzleFilename);
    const solutionPath = path.join(generatedDir, solutionFilename);

    const puzzleUrl = `/generated/${puzzleFilename}`;
    const solutionUrl = `/generated/${solutionFilename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${puzzleUrl}`;

    // Generate and save puzzle HTML
    const puzzleHtml = generatePuzzleHTML(puzzleData, solutionUrl);
    fs.writeFileSync(puzzlePath, puzzleHtml);

    // Generate and save solution HTML
    const solutionHtml = generateSolutionHTML(puzzleData, puzzleUrl);
    fs.writeFileSync(solutionPath, solutionHtml);

    // Return a JSON object with the URL
    res.json({
        url: fullUrl,
        success: true
    });
});

module.exports = router; 