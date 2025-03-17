/**
 * Input Validator Module
 * Contains validation logic for puzzle generation inputs
 */

/**
 * Validates a list of words
 * @param {string[]} words - Array of words to validate
 * @returns {Object} Validation result with success status and error message if any
 */
function validateWords(words) {
    if (!Array.isArray(words)) {
        return {
            isValid: false,
            error: "Words must be an array"
        };
    }

    if (words.length === 0) {
        return {
            isValid: false,
            error: "Please enter at least one word"
        };
    }

    if (words.length > 10) {
        return {
            isValid: false,
            error: "Maximum 10 words allowed"
        };
    }

    if (!words.every(word => typeof word === 'string')) {
        return {
            isValid: false,
            error: "All words must be strings"
        };
    }

    // Check if any word is too long for the grid
    if (!words.every(word => word.length <= 10)) {
        return {
            isValid: false,
            error: "All words must be 10 characters or less"
        };
    }

    return { isValid: true };
}

/**
 * Validates a grid of letters
 * @param {string[]} grid - Array of letters to validate
 * @returns {Object} Validation result with success status and error message if any
 */
function validateGrid(grid) {
    if (!Array.isArray(grid)) {
        return {
            isValid: false,
            error: "Grid must be an array"
        };
    }

    if (grid.length !== 100) {
        return {
            isValid: false,
            error: "Grid must contain exactly 100 letters"
        };
    }

    if (!grid.every(letter => typeof letter === 'string' && letter.length === 1)) {
        return {
            isValid: false,
            error: "Grid must contain single letters"
        };
    }

    // Check if all letters are valid (A-Z)
    const validLetters = /^[A-Za-z]$/;
    if (!grid.every(letter => validLetters.test(letter))) {
        return {
            isValid: false,
            error: "Grid must contain only letters A-Z"
        };
    }

    return { isValid: true };
}

/**
 * Validates a complete puzzle request
 * @param {Object} request - The puzzle request object
 * @returns {Object} Validation result with success status and error message if any
 */
function validatePuzzleRequest(request) {
    try {
        // Validate words
        const wordsValidation = validateWords(request.words);
        if (!wordsValidation.isValid) {
            return wordsValidation;
        }

        // If grid is provided, validate it
        if (request.grid) {
            const gridValidation = validateGrid(request.grid);
            if (!gridValidation.isValid) {
                return gridValidation;
            }
        }

        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: "Invalid request format"
        };
    }
}

module.exports = {
    validateWords,
    validateGrid,
    validatePuzzleRequest
}; 