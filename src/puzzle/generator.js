/**
 * Puzzle Generator Module
 * Contains core logic for generating word search puzzles
 */

/**
 * Creates an empty grid of specified size
 * @param {number} size - Size of the grid (default: 10)
 * @returns {Array<Array<string>>} Empty 2D grid
 */
function createEmptyGrid(size = 10) {
    return Array(size).fill().map(() => Array(size).fill(''));
}

/**
 * Checks if a word can be placed at the given position and direction
 * @param {Array<Array<string>>} grid - The current grid
 * @param {string} word - The word to place
 * @param {number} row - Starting row position
 * @param {number} col - Starting column position
 * @param {number} dRow - Row direction (-1, 0, or 1)
 * @param {number} dCol - Column direction (-1, 0, or 1)
 * @returns {Object|false} Position information if placement is possible, false otherwise
 */
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
            continue;
        } else {
            return false;
        }
    }
    
    // If we get here, we can place the word
    // Fill in all the new positions
    positionsToFill.forEach(([r, c, letter]) => {
        grid[r][c] = letter;
    });
    
    return {
        success: true,
        start: [row, col],
        end: [row + (dRow * (wordLength - 1)), col + (dCol * (wordLength - 1))],
        direction: [dRow, dCol]
    };
}

/**
 * Attempts to place a word in the grid
 * @param {Array<Array<string>>} grid - The current grid
 * @param {string} word - The word to place
 * @returns {Object} Result of placement attempt
 */
function placeWord(grid, word) {
    const size = grid.length;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],  // Up-left, Up, Up-right
        [0, -1],           [0, 1],    // Left, Right
        [1, -1],  [1, 0],  [1, 1]     // Down-left, Down, Down-right
    ];
    
    // Try 100 random positions for better chances
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

/**
 * Generates a word search puzzle from a list of words
 * @param {string[]} words - Array of words to place in the puzzle
 * @returns {Object} Generated puzzle data
 */
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

module.exports = {
    generateWordSearch,
    createEmptyGrid,
    placeWord,
    canPlaceWord
}; 