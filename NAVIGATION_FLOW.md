# Complete Navigation Flow

## Four Levels of Investigation

```
LEVEL 1: Conversation List                   LEVEL 2: Single Conversation Detail
┌──────────────────────────────┐             ┌──────────────────────────────┐
│  📊 All Conversations (/)    │             │  🔍 Conversation 691         │
│                              │             │                              │
│  [Search: _________]         │             │  ┌────────┐ ┌────────┐      │
│  Filter: [Type▼] [Source▼]  │   Click     │  │ 57     │ │ 0.554  │      │
│                              │   Row       │  │ Turns  │ │ Gini   │      │
│  ┌────┬──────┬──────┬──────┐ │  ────────>  │  └────────┘ └────────┘      │
│  │ ☐  │ ID   │ Type │ ...  │ │             │                              │
│  ├────┼──────┼──────┼──────┤ │             │  [Turn Sequence Chart]       │
│  │ ☐  │ 691  │ Fora │ ...  │─┤             │  [Speaker Distribution]      │
│  │ ☐  │ 1726 │ Maine│ ...  │ │             │  [Metrics Breakdown]         │
│  │ ☐  │ 2138 │ Maine│ ...  │ │             │  [UMAP Position]             │
│  └────┴──────┴──────┴──────┘ │             │                              │
│                              │             │  📝 Transcript               │
│  [Compare Selected (3)]      │             │  Turn 1: "Recording started" │
│                              │             │  Turn 12: "Can we discuss..." │
└──────────────────────────────┘             │  - 8 responses 🔥            │
         │                                   │                              │
         │ Select multiple                  │  [🔬 Analyze Turns]          │
         │ conversations                    │  [➕ Add to Compare]         │
         ↓                                   └──────────────────────────────┘
                                                     │           │
                                                     │ Analyze   │ Compare
                                                     │           ↓
                                                     │
LEVEL 3: Turn Analysis                              │    LEVEL 4: Comparison
┌──────────────────────────────┐                    │    ┌──────────────────────┐
│  🔬 Turns in Conv 691        │ <──────────────────┘    │  ⚖️ Compare View     │
│                              │                         │                      │
│  [Search turns: ______]      │                         │  Comparing:          │
│  Min responses: [3+▼]        │                         │  691 vs 1726 vs 2138│
│  Sort by: [Response Count▼]  │                         │                      │
│                              │                         │  Metrics Table:      │
│  🕸️ Response Network         │                         │  ┌──────┬───┬───┬───┐│
│  [Interactive graph showing  │                         │  │Metric│691│...│...││
│   which turns respond to     │                         │  ├──────┼───┼───┼───┤│
│   which other turns]         │                         │  │Turns │ 57│ 64│214││
│                              │                         │  │Gini  │.55│.17│.46││
│  Turns Table:                │                         │  └──────┴───┴───┴───┘│
│  ┌───┬────┬────────┬────┬───┐│                         │                      │
│  │ ☐ │ # │Speaker │Resp│...││                         │  [Overlaid Charts]   │
│  ├───┼────┼────────┼────┼───┤│                         │  [Statistical Tests] │
│  │ ☐ │ 12│ Alice  │ 8  │...││                         │                      │
│  │ ☐ │ 45│ Bob    │ 5  │...││                         │  OR                  │
│  │ ☐ │ 78│ Carol  │ 3  │...││                         │                      │
│  └───┴────┴────────┴────┴───┘│                         │  Group Comparison:   │
│                              │                         │  Fora vs Analogia    │
│  Turn 12 Details:            │                         │  (65 vs 36 convs)    │
│  ┌──────────────────────────┐│                         │                      │
│  │ "Can we discuss..."      ││                         │  [Box Plots]         │
│  │                          ││                         │  [Distributions]     │
│  │ 8 responses received:    ││                         │  [T-tests]           │
│  │ • Turn 13 (Bob)          ││                         └──────────────────────┘
│  │ • Turn 15 (Carol)        ││
│  │ • Turn 18 (David)        ││
│  │ ...                      ││
│  │ [Response Timeline]      ││
│  └──────────────────────────┘│
│                              │
│  [Compare Selected Turns]    │
└──────────────────────────────┘
```

## URL Structure

```
Level 1: /
         - Home page with conversation table

Level 2: /conversation/:id
         - Example: /conversation/691
         - Single conversation detail

Level 3: /turns/:conversationId
         - Example: /turns/691
         - Turn-level analysis for conversation 691
         - Optional: /turns/:conversationId/:turnId
           to highlight specific turn

Level 4: /compare
         - Individual: /compare?ids=691,1726,2138
         - Groups: /compare?groups=Fora+Corpus,Analogia
         - Clusters: /compare?clusters=0,1,2
         - Turns: /compare?turns=691_12,691_45,1726_23
```

## User Journeys

### Journey 1: Exploring a Conversation
```
1. Land on homepage (/)
2. Filter by Type: "Fora Corpus"
3. Click conversation 691
4. View metrics and visualizations
5. Notice turn 12 has 8 responses
6. Click "Analyze Turns"
7. See turn 12 is highlighted
8. Explore response network
9. Select other high-response turns
10. Click "Compare Selected Turns"
```

### Journey 2: Comparing Groups
```
1. Land on homepage (/)
2. Select all "Fora Corpus" conversations (checkbox)
3. Select all "Analogia" conversations
4. Click "Compare Selected"
5. Choose "Compare as Groups"
6. See aggregate metrics and distributions
7. Notice Fora has higher entropy
8. Drill into specific conversation
9. Investigate why
```

### Journey 3: Finding High-Impact Turns
```
1. View conversation 691 detail
2. Click "Analyze Turns"
3. Sort by: "Response Count" (descending)
4. Filter: "Min responses: 5+"
5. See top 10 high-response turns
6. Click turn 12 details
7. See full response chain
8. Add to comparison
9. Repeat for other conversations
10. Compare turn patterns across conversations
```

## Key Features by Level

### Level 1: List (Current)
✅ Table with metrics
✅ Filter by type, source
✅ Sort all columns
🔄 Add: Search
🔄 Add: Checkboxes for selection
🔄 Add: Mini sparklines

### Level 2: Detail (To Build)
- Overview metrics cards
- Turn sequence visualization
- Speaker distribution
- Transcript with turn numbers
- UMAP position
- Related conversations
- "Analyze Turns" button
- "Add to Compare" button

### Level 3: Turn Analysis (To Build)
- Response network graph
- Filterable turn table
- Sort by response metrics
- Turn detail panel
- Response chain visualization
- Turn selection for comparison

### Level 4: Compare (To Build)
- Side-by-side metrics
- Overlaid visualizations
- Group aggregation
- Statistical tests
- Turn-level comparison
- Export capabilities

## Data Calculations Needed

### Turn Metrics (calculate from JSON)
```javascript
For each turn in conversation:
  - Count direct responses (link_turn_id points to this turn)
  - Count total response chain depth
  - Identify substantive vs mechanical responses
  - Calculate response latency (time between turns)
  - List all speakers who responded
  - Build response tree structure
```

### Aggregations (for groups)
```javascript
For group of conversations:
  - Mean, median, std dev of all metrics
  - Distribution plots
  - Outlier detection
  - Correlation between metrics
```

## Technical Stack

- **Routing**: React Router v6
- **State**: React Context + hooks
- **Charts**: Recharts (simple) + D3.js (custom)
- **Network graphs**: React Flow or vis-network
- **Data processing**: Custom hooks + utility functions

