# FindWordWiz

A modern web application that generates beautiful word search puzzles. Create engaging puzzles automatically from your word lists or design custom grids manually.

## Features

- **Automatic Puzzle Generation**
  - Generate word search puzzles from any list of words
  - Smart word placement algorithm
  - Support for up to 10 words per puzzle
  - Words placed horizontally, vertically, and diagonally
  - Random letter filling for empty spaces

- **Manual Puzzle Creation**
  - Create custom puzzles with your own grid layout
  - Full control over letter placement
  - Perfect for themed puzzles or specific layouts

- **User-Friendly Interface**
  - Modern, responsive design
  - Dark theme with beautiful backgrounds
  - Print-friendly layouts
  - Copy-to-clipboard functionality
  - Real-time validation and error feedback

- **Puzzle Management**
  - Unique URLs for each puzzle
  - Solution view with highlighted words
  - Print functionality for both puzzles and solutions
  - Easy sharing capabilities

- **API Integration**
  - RESTful API for programmatic access
  - CORS enabled for cross-origin requests
  - Comprehensive error handling
  - Input validation

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/findwordwiz.git
cd findwordwiz
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The application will be available at http://localhost:3000

For development with auto-reload:
```bash
npm run dev
```

## API Documentation

### 1. Auto-Generate Puzzle
```http
POST /api/generate/auto
```

Automatically generates a word search puzzle from a list of words.

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
    "puzzleUrl": "/generated/puzzle_[timestamp].html",
    "fullUrl": "http://localhost:3000/generated/puzzle_[timestamp].html",
    "notPlaced": []
}
```

### 2. Manual Puzzle Generation
```http
POST /api/generate
```

Creates a puzzle using a provided grid and word list.

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
    "puzzleUrl": "/generated/puzzle_[timestamp].html",
    "fullUrl": "http://localhost:3000/generated/puzzle_[timestamp].html"
}
```

### Validation Rules

1. Word List Requirements:
   - Must be an array of strings
   - 1-10 words allowed
   - No empty arrays
   - All words must be strings
   - Maximum word length must fit within the 10x10 grid

2. Grid Requirements (for manual generation):
   - Must be an array of exactly 100 letters
   - Each element must be a single letter
   - No empty or invalid grids allowed

3. General Rules:
   - All input is converted to uppercase
   - Special characters and spaces not supported
   - Grid size is fixed at 10x10

### Error Responses

The API returns appropriate error messages with 400 status code:

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

The web interface at http://localhost:3000 provides:

1. **Puzzle Generation**
   - Input section for words and grid
   - Sample inputs with copy functionality
   - Real-time validation
   - Error feedback

2. **Puzzle Display**
   - Clean, readable grid layout
   - Word list display
   - Print functionality
   - Solution view access

3. **Solution View**
   - Highlighted word locations
   - Print-friendly layout
   - Easy navigation back to puzzle

## Development

### Project Structure
```
findwordwiz/
├── public/
│   ├── index.html (main interface)
│   ├── templates/
│   │   ├── puzzle.html
│   │   ├── solution.html
│   │   └── formexample.html
│   └── images/
├── server.js
├── package.json
└── README.md
```

### Dependencies
- express: ^4.18.3
- cors: ^2.8.5
- open: ^10.1.0
- nodemon: ^3.1.0 (dev)

## Requirements

- Node.js 14.0 or higher
- npm 6.0 or higher

## License

MIT License 