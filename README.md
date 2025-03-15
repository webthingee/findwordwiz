# Word Search Generator API

A simple API for generating word search puzzles.

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

## API Usage

### Generate Word Search

**Endpoint:** `POST /api/generate`

**Request Body:**
```json
{
    "words": ["WORD1", "WORD2", "WORD3"],
    "grid": ["A","B","C",...] // Array of 100 letters
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "words": ["REMOTE", "BINGE", "EPISODE"],
    "grid": ["R","E","M","O","T","E","B","I","N","G","E","P","I","S","O","D","E"]
  }'
```

**Response:**
```json
{
    "words": ["REMOTE", "BINGE", "EPISODE"],
    "grid": ["R","E","M","O","T","E","B","I","N","G","E","P","I","S","O","D","E"]
}
```

### Validation Rules

- Both `words` and `grid` must be arrays
- Grid must contain exactly 100 letters
- Words array must contain between 1 and 10 words
- All words must be strings
- Grid must contain single letters
- All input will be converted to uppercase

### Error Responses

The API will return a 400 status code with an error message for invalid inputs:

```json
{
    "error": "Error message here"
}
```

## Web Interface

A web interface is available at http://localhost:3000 where you can:
1. Input words and grid data in JSON format
2. Generate word searches
3. View and print the results
4. Copy example API requests 