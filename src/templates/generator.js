/**
 * Template Generator Module
 * Contains functions for generating HTML templates for puzzles and solutions
 */

const fs = require('fs');
const path = require('path');

// Load templates on module initialization
const templates = {
    puzzle: null,
    solution: null
};

function loadTemplates() {
    try {
        templates.puzzle = fs.readFileSync(path.join(__dirname, '../../public/templates/puzzle.html'), 'utf8');
        templates.solution = fs.readFileSync(path.join(__dirname, '../../public/templates/solution.html'), 'utf8');
        console.log('Templates loaded successfully');
    } catch (error) {
        console.error('Error loading templates:', error);
        throw error;
    }
}

// Load templates immediately
loadTemplates();

/**
 * Generates HTML for a puzzle
 * @param {Object} data - Puzzle data
 * @param {string[]} data.words - List of words to find
 * @param {string[]} data.grid - Grid of letters
 * @param {string} solutionUrl - URL to the solution page
 * @param {string} [backgroundUrl] - Optional background image URL
 * @param {string} [title] - Optional title for the puzzle
 * @returns {string} Generated HTML
 */
function generatePuzzleHTML(data, solutionUrl, backgroundUrl = '/images/test.jpg', title = 'Find Word Wiz') {
    const gridCells = data.grid.map(letter => `<div class="cell">${letter}</div>`).join('');
    const wordList = data.words.map(word => `<li>${word}</li>`).join('');
    
    let html = templates.puzzle
        .replace('{{GRID_CELLS}}', gridCells)
        .replace('{{WORD_LIST}}', wordList)
        .replace('{{SOLUTION_URL}}', solutionUrl)
        .replace(/{{TITLE}}/g, title)
        .replace('{{BACKGROUND_URL}}', backgroundUrl);
    
    return html;
}

/**
 * Generates HTML for a solution
 * @param {Object} data - Puzzle data
 * @param {string[]} data.words - List of words to find
 * @param {string[]} data.grid - Grid of letters
 * @param {Array} data.wordPositions - Array of word positions and directions
 * @param {string} puzzlePath - Path back to the puzzle
 * @param {string} [backgroundUrl] - Optional background image URL
 * @param {string} [title] - Optional title for the puzzle
 * @returns {string} Generated HTML
 */
function generateSolutionHTML(data, puzzlePath, backgroundUrl = '/images/test.jpg', title = 'Find Word Wiz') {
    const gridCells = data.grid.map((letter, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        let isHighlighted = false;
        
        // Check if this cell is part of any word
        if (Array.isArray(data.wordPositions)) {
            for (const pos of data.wordPositions) {
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
    
    const wordList = data.words.map(word => `<li>${word}</li>`).join('');
    
    let html = templates.solution
        .replace('{{GRID_CELLS}}', gridCells)
        .replace('{{WORD_LIST}}', wordList)
        .replace('{{PUZZLE_URL}}', puzzlePath)
        .replace(/{{TITLE}}/g, title)
        .replace('{{BACKGROUND_URL}}', backgroundUrl);
    
    return html;
}

module.exports = {
    generatePuzzleHTML,
    generateSolutionHTML,
    loadTemplates
}; 