# Conversation Dynamics Visualization

A React application for visualizing conversation dynamics from conversation data.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm start
```

The application will open in your browser at [http://localhost:3000](http://localhost:3000).

## Features

- Clean, modern UI using Material-UI (MUI)
- Lists all conversations with metadata
- Shows conversation ID, group, turn count, speaker count, and duration
- Hover effects for better interactivity
- Responsive design

## Data Structure

The app reads from `merged_data.json` which contains conversation data with:
- Conversation IDs
- Turn-by-turn dialogue
- Speaker information
- Timestamps
- Group affiliations

