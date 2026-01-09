# Project Structure

## Overview
The app has been refactored into a clean, modular component structure to support adding new pages and features.

## Directory Structure

```
src/
├── App.js                          # Main app entry point (clean & simple!)
├── index.js                        # React root
├── theme.js                        # Material-UI theme configuration
│
├── components/                     # Reusable UI components
│   ├── ConversationFilters.jsx    # Filter dropdowns component
│   ├── ConversationTable.jsx      # Main table component
│   ├── ConversationTableHeader.jsx # Table header with sorting
│   └── ConversationTableRow.jsx   # Individual table row
│
├── hooks/                          # Custom React hooks
│   └── useConversationData.js     # Data loading and filtering logic
│
└── [data files]
    ├── combined.json              # Conversation data
    └── features+umap+clusters.json # Features data
```

## Key Components

### `App.js`
- Clean main component (~60 lines)
- Handles state management (sorting, filtering)
- Composes other components together

### `components/ConversationFilters.jsx`
- Displays conversation count and filter dropdowns
- Receives filter state and handlers as props

### `components/ConversationTable.jsx`
- Main table container with scrolling
- Composes header and body
- Passes sorting handlers down

### `components/ConversationTableHeader.jsx`
- Sortable column headers
- Handles all column definitions

### `components/ConversationTableRow.jsx`
- Individual conversation row
- Handles data formatting and display

### `hooks/useConversationData.js`
- `useConversationData()` - Loads and processes data
- `useConversationFilters()` - Filters and sorts conversations

### `theme.js`
- Material-UI theme with warm colors
- Typography and component styling

## Adding New Pages

To add a new page (e.g., a visualization page):

1. **Create a new component:**
   ```jsx
   // src/components/VisualizationPage.jsx
   import React from 'react';
   import { useConversationData } from '../hooks/useConversationData';
   
   function VisualizationPage() {
     const { conversations, loading } = useConversationData();
     // Your visualization code here
     return <div>Visualization</div>;
   }
   
   export default VisualizationPage;
   ```

2. **Add routing (if needed):**
   - Install react-router: `npm install react-router-dom`
   - Update `App.js` to include routes

3. **Reuse existing components:**
   - Import `ConversationFilters` for filtering
   - Use `useConversationData` hook for data access
   - Import `theme` for consistent styling

## Benefits of This Structure

✅ **Modular**: Each component has a single responsibility
✅ **Reusable**: Components can be used across multiple pages
✅ **Maintainable**: Easy to find and update specific features
✅ **Scalable**: Simple to add new pages and features
✅ **Clean**: Main App.js stays small and readable

## Example: Adding a New Feature

Want to add a search bar? Create `ConversationSearch.jsx`:

```jsx
// src/components/ConversationSearch.jsx
import React from 'react';
import { TextField } from '@mui/material';

function ConversationSearch({ searchTerm, onSearchChange }) {
  return (
    <TextField
      size="small"
      placeholder="Search conversations..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
    />
  );
}

export default ConversationSearch;
```

Then import and use it in `App.js` or `ConversationFilters.jsx`!

