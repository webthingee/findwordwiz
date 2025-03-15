# FindWordWiz

A web application that generates word search puzzles. You can either provide your own grid of letters and words, or let the application automatically generate a puzzle from your list of words.

## Features

- Generate word search puzzles automatically from a list of words
- Support for up to 10 words per puzzle
- Words can be placed horizontally, vertically, and diagonally
- Each puzzle gets a unique URL for sharing
- Print-friendly puzzle pages
- RESTful API for integration with other applications

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run at http://localhost:3000

## API Documentation

### 1. Auto-Generate Puzzle
```http
POST /api/generate/auto
```

Automatically generates a word search puzzle from a list of words. The application will place the words in random positions and directions, then fill the remaining spaces with random letters.

**Request Body:**
```json
{
    "words": ["WORD1", "WORD2", "WORD3"]
}
```

**Response:**
```json
{
    "words": ["WORD1", "WORD2", "WORD3"],
    "grid": ["A", "B", "C", ...],
    "puzzleUrl": "/generated/puzzle_2024-03-15_12-34-56-789.html",
    "fullUrl": "http://localhost:3000/generated/puzzle_2024-03-15_12-34-56-789.html",
    "notPlaced": []
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/generate/auto \
  -H "Content-Type: application/json" \
  -d '{
    "words": ["REMOTE", "BINGE", "EPISODE"]
  }'
```

### 2. Manual Puzzle Generation
```http
POST /api/generate
```

Generates a puzzle using a provided grid and word list. Use this when you want complete control over the letter placement.

**Request Body:**
```json
{
    "words": ["WORD1", "WORD2", "WORD3"],
    "grid": ["A","B","C",...] // Array of 100 letters
}
```

**Response:**
```json
{
    "words": ["WORD1", "WORD2", "WORD3"],
    "grid": ["A","B","C",...],
    "puzzleUrl": "/generated/puzzle_2024-03-15_12-34-56-789.html",
    "fullUrl": "http://localhost:3000/generated/puzzle_2024-03-15_12-34-56-789.html"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "words": ["REMOTE", "BINGE", "EPISODE"],
    "grid": ["R","E","M","O","T","E","B","I","N","G","E","P","I","S","O","D","E",...] // 100 letters total
  }'
```

### Validation Rules

Both endpoints enforce the following rules:

1. Word List Validation:
   - Must be an array of strings
   - Must contain between 1 and 10 words
   - Empty arrays are not allowed
   - All words must be strings

2. Grid Validation (for `/api/generate`):
   - Must be an array of exactly 100 letters
   - Each element must be a single letter
   - Empty or invalid grids will be rejected

3. General:
   - All input is converted to uppercase
   - Special characters and spaces in words are not supported
   - Maximum word length should fit within the 10x10 grid

### Error Responses

The API returns a 400 status code with an error message for invalid inputs:

```json
{
    "error": "Error message describing the issue"
}
```

Common error messages:
- "Words must be an array"
- "Please enter at least one word"
- "Maximum 10 words allowed"
- "Grid must contain exactly 100 letters"
- "Grid must contain single letters"
- "Invalid JSON format"

## Web Interface

A user-friendly web interface is available at http://localhost:3000 where you can:
1. Enter words for automatic puzzle generation
2. View the generated puzzle
3. Print the puzzle in a clean, formatted layout
4. Share the puzzle via a unique URL
5. Create new puzzles with a single click

## Development

Run the server in development mode with auto-reload:
```bash
npm run dev
```

## Requirements

- Node.js 14.0 or higher
- npm 6.0 or higher

## License

MIT License 