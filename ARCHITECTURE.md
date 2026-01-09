# Application Architecture

## Overview
This document outlines the architecture for the conversation dynamics visualization app with four main features:
1. **Search, Filter, Sort** - Table view with advanced filtering
2. **Deep Dive** - Single conversation detailed visualization
3. **Compare** - Side-by-side comparison of conversations or groups
4. **Turn-Level Analysis** - Investigate individual turns and their response patterns

## Application Structure

### Directory Layout
```
src/
├── App.js                          # Main app with routing
├── index.js
├── theme.js
│
├── pages/                          # Main page components
│   ├── ConversationListPage.jsx   # Home - table view
│   ├── ConversationDetailPage.jsx # Single conversation deep dive
│   ├── ConversationComparePage.jsx # Comparison view
│   └── TurnAnalysisPage.jsx       # Turn-level investigation
│
├── components/
│   ├── layout/
│   │   ├── Navigation.jsx         # Top navigation bar
│   │   ├── SelectionBar.jsx       # Shows selected items
│   │   └── PageLayout.jsx         # Common page wrapper
│   │
│   ├── table/                     # Table components (existing)
│   │   ├── ConversationFilters.jsx
│   │   ├── ConversationTable.jsx
│   │   ├── ConversationTableHeader.jsx
│   │   └── ConversationTableRow.jsx
│   │
│   ├── visualizations/            # Reusable charts
│   │   ├── TurnSequenceChart.jsx  # Turn-taking timeline
│   │   ├── SpeakerDistribution.jsx # Speaker participation
│   │   ├── MetricsCards.jsx       # Key metrics display
│   │   ├── EntropyChart.jsx       # Entropy metrics
│   │   ├── GiniChart.jsx          # Gini coefficients
│   │   ├── UMAPScatter.jsx        # UMAP projection
│   │   └── ConversationTimeline.jsx # Full timeline
│   │
│   ├── detail/                    # Detail page specific
│   │   ├── ConversationOverview.jsx
│   │   ├── ConversationTranscript.jsx
│   │   ├── RelatedConversations.jsx
│   │   └── TurnsList.jsx          # Sortable/filterable turns
│   │
│   ├── turns/                     # Turn-level analysis
│   │   ├── TurnCard.jsx           # Individual turn display
│   │   ├── TurnFilters.jsx        # Filter by response count, etc.
│   │   ├── TurnComparison.jsx     # Compare multiple turns
│   │   ├── ResponseGraph.jsx      # Visualize turn → response links
│   │   └── TurnMetricsTable.jsx   # Sortable turn metrics
│   │
│   └── comparison/                # Comparison components
│       ├── ComparisonSelector.jsx
│       ├── MetricsComparisonTable.jsx
│       ├── SideBySideView.jsx
│       ├── GroupAggregator.jsx
│       └── ComparisonCharts.jsx
│
├── context/
│   └── SelectionContext.jsx       # Global selection state
│
├── hooks/
│   ├── useConversationData.js     # Data loading (existing)
│   ├── useSelection.js            # Selection management
│   ├── useComparison.js           # Comparison logic
│   └── useTurnAnalysis.js         # Turn-level data processing
│
└── utils/
    ├── conversationUtils.js       # Helper functions
    ├── turnUtils.js               # Turn-level utilities
    ├── chartConfig.js             # Chart configurations
    └── aggregation.js             # Group aggregation logic
```

## Page Specifications

### 1. List Page (Home) - `/`
**Purpose**: Browse, search, filter, and select conversations

**Features**:
- Table with all metrics (current functionality)
- Search bar (by ID, facilitator, title)
- Multiple filters (Type, Source, Cluster)
- Sortable columns
- Checkbox selection for comparison
- "Compare Selected" button (appears when 2+ selected)
- Optional: Mini sparklines in rows

**User Flow**:
```
Browse table → Filter/Sort → Select conversation(s)
    ↓              ↓              ↓
Click row    Search term    Check boxes → Click "Compare"
    ↓                              ↓
Detail page                   Compare page
```

### 2. Detail Page - `/conversation/:id`
**Purpose**: Deep dive into a single conversation

**Layout**:
```
┌─────────────────────────────────────────┐
│ Navigation: Home > Conversation 691     │
├─────────────────────────────────────────┤
│ OVERVIEW SECTION                        │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │Turns │ │Speak.│ │Clust.│ │Entr. │   │
│ └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│ TURN DYNAMICS                           │
│ [Interactive timeline visualization]    │
├─────────────────────────────────────────┤
│ SPEAKER ANALYSIS                        │
│ [Pie chart]  [Bar chart]                │
├─────────────────────────────────────────┤
│ METRICS DEEP DIVE                       │
│ [Gini coefficients] [Entropy metrics]   │
├─────────────────────────────────────────┤
│ UMAP POSITION                           │
│ [Scatter plot showing this conversation]│
├─────────────────────────────────────────┤
│ FULL TRANSCRIPT                         │
│ [Scrollable turn-by-turn transcript]    │
├─────────────────────────────────────────┤
│ SIMILAR CONVERSATIONS                   │
│ [Cards of conversations in same cluster]│
└─────────────────────────────────────────┘
```

**Actions**:
- "Add to comparison" button
- "Compare with..." dropdown
- "View cluster" link
- **"Analyze Turns"** button → Goes to turn analysis

### 3. Turn Analysis Page - `/turns/:convId`
**Purpose**: Investigate individual turns and their response patterns

**Layout**:
```
┌─────────────────────────────────────────┐
│ Navigation: Home > Conv 691 > Turns     │
├─────────────────────────────────────────┤
│ FILTERS & SEARCH                        │
│ [Search turns] [Min responses: 3+]      │
│ [Sort by: Response Count ▼]             │
├─────────────────────────────────────────┤
│ RESPONSE NETWORK                        │
│ [Interactive graph showing turn links]  │
│ - Nodes = turns                         │
│ - Edges = responses                     │
│ - Size = response count                 │
├─────────────────────────────────────────┤
│ TURNS TABLE                             │
│ ✓│Turn│Speaker│Words│Resp.│Type│Actions│
│ ─┼────┼────────┼─────┼─────┼────┼───────│
│ ☐│ 12 │ Alice │ ... │  8  │Sub.│[View] │
│ ☐│ 45 │ Bob   │ ... │  5  │Sub.│[View] │
│ ☐│ 78 │ Carol │ ... │  3  │Mech│[View] │
├─────────────────────────────────────────┤
│ SELECTED TURN DETAILS (when row clicked)│
│ Turn 12 by Alice                        │
│ "Can we discuss the budget allocation?"│
│                                         │
│ Responses received: 8                   │
│ [Timeline showing when responses came]  │
│                                         │
│ Response breakdown:                     │
│ - Substantive: 6                        │
│ - Mechanical: 2                         │
│                                         │
│ Who responded:                          │
│ - Bob (turn 13)                         │
│ - Carol (turn 15)                       │
│ - David (turn 18)                       │
│ [... full response list ...]            │
└─────────────────────────────────────────┘
```

**Features**:
- **Filter turns by**:
  - Response count (e.g., "Show turns with 5+ responses")
  - Response type (substantive vs mechanical)
  - Speaker
  - Position in conversation (early/middle/late)
  - Keywords in text

- **Sort turns by**:
  - Response count (most → least)
  - Turn number
  - Speaker
  - Length
  - Substantive response rate

- **Actions**:
  - Select multiple turns for comparison
  - "Compare Selected Turns" button
  - Export turn data
  - Highlight response chains

**Turn Metrics to Calculate**:
```javascript
{
  turnId: "691_12",
  conversationId: 691,
  turnNumber: 12,
  speaker: "Alice",
  words: "Can we discuss...",
  
  // Response metrics
  directResponses: 3,        // Turns that directly link to this
  totalResponses: 8,         // All turns in response chain
  responseDepth: 3,          // Max depth of response chain
  
  substantiveResponses: 6,
  mechanicalResponses: 2,
  
  responseLatency: 145.2,    // Avg seconds until response
  
  // Who responded
  respondingSpeakers: ["Bob", "Carol", "David"],
  
  // Link data (from JSON)
  linkedTurns: [13, 15, 18, 22, 34, 45, 67, 78],
}
```

### 4. Compare Page - `/compare`
**Purpose**: Compare multiple conversations or groups

**Two Modes**:

#### Mode A: Individual Comparison
Compare 2-4 specific conversations
```
URL: /compare?ids=691,1726,2138
```

**Layout**:
```
┌─────────────────────────────────────────┐
│ Comparing: Conv 691 | Conv 1726 | 2138 │
├─────────────────────────────────────────┤
│ METRICS COMPARISON TABLE                │
│ Metric          │ 691   │ 1726  │ 2138  │
│ ────────────────┼───────┼───────┼────────│
│ Turns           │ 57    │ 64    │ 214   │
│ Speaking Gini   │ 0.554 │ 0.174 │ 0.459 │
├─────────────────────────────────────────┤
│ VISUALIZATIONS (Overlaid)               │
│ [Combined chart showing all 3]          │
├─────────────────────────────────────────┤
│ STATISTICAL COMPARISON                  │
│ [Differences, ranges, outliers]         │
└─────────────────────────────────────────┘
```

#### Mode B: Group Comparison
Compare aggregated groups (e.g., by Type or Cluster)
```
URL: /compare?groups=Fora+Corpus,Analogia
```

**Layout**:
```
┌─────────────────────────────────────────┐
│ Comparing Groups: Fora Corpus | Analogia│
│ (65 conversations) | (36 conversations) │
├─────────────────────────────────────────┤
│ AGGREGATE METRICS                       │
│ Metric          │ Fora   │ Analogia     │
│ ────────────────┼────────┼──────────────│
│ Avg Turns       │ 143.2  │ 178.5        │
│ Avg Gini        │ 0.402  │ 0.385        │
│ Median Entropy  │ 0.741  │ 0.682        │
├─────────────────────────────────────────┤
│ DISTRIBUTION COMPARISON                 │
│ [Box plots, violin plots]               │
├─────────────────────────────────────────┤
│ STATISTICAL TESTS                       │
│ [T-tests, effect sizes]                 │
└─────────────────────────────────────────┘
```

## State Management

### Selection Context
```javascript
{
  selectedIds: [691, 1726],
  selectedGroups: ['Fora Corpus'],
  comparisonMode: 'individual' | 'group',
  actions: {
    selectConversation,
    deselectConversation,
    clearSelection,
    selectGroup,
  }
}
```

### URL State
- Use query parameters for shareable links
- Examples:
  - `/conversation/691`
  - `/compare?ids=691,1726,2138`
  - `/compare?groups=Fora+Corpus,Analogia`
  - `/compare?clusters=0,1,2`

## Data Flow

```
1. Data Loading (on app start)
   useConversationData hook
   ↓
   Load combined.json + features.json
   ↓
   Process and merge data
   ↓
   Store in context/state

2. List Page
   Display table → User filters/sorts
   ↓
   User selects conversations (checkbox)
   ↓
   Selection stored in SelectionContext
   ↓
   User clicks "Compare" → Navigate to compare page

3. Detail Page
   Get conversation ID from URL params
   ↓
   Find conversation in data
   ↓
   Render visualizations
   ↓
   User can add to comparison

4. Compare Page
   Get IDs or groups from URL params
   ↓
   Fetch selected conversations
   ↓
   Calculate aggregations (if groups)
   ↓
   Render side-by-side visualizations

5. Turn Analysis Page
   Get conversation ID from URL params
   ↓
   Load conversation turn data
   ↓
   Calculate response metrics for each turn
   ↓
   Build response graph/network
   ↓
   User filters/sorts turns
   ↓
   Click turn → Show detail panel
   ↓
   Select multiple turns → Compare
```

## Implementation Phases

### Phase 1: Routing & Selection (Foundation)
1. Install react-router-dom
2. Set up routes in App.js
3. Create SelectionContext
4. Add checkboxes to table
5. Create Navigation component
6. Create SelectionBar component

### Phase 2: Detail Page (Deep Dive)
1. Create ConversationDetailPage
2. Build metric cards component
3. Create turn sequence visualization
4. Add speaker distribution charts
5. Create transcript viewer
6. Add UMAP position indicator
7. Add "related conversations" section

### Phase 3: Compare Page (Individual)
1. Create ConversationComparePage
2. Build comparison selector
3. Create metrics comparison table
4. Add overlaid visualizations
5. Implement statistical comparison

### Phase 4: Compare Page (Groups)
1. Add group aggregation logic
2. Create box plot/violin plot components
3. Add statistical tests
4. Implement group selection UI

### Phase 5: Turn-Level Analysis
1. Create useTurnAnalysis hook
2. Calculate turn response metrics
3. Build TurnAnalysisPage
4. Create turn filters and sorting
5. Build response network visualization
6. Add turn comparison feature
7. Create turn detail panel

### Phase 6: Enhancement
1. Add advanced search functionality
2. Add export features (CSV, JSON, images)
3. Add "save comparison" feature
4. Add annotations/notes
5. Performance optimization
6. Add turn-to-turn response heatmaps
7. Cross-conversation turn comparison

## Visualization Library Recommendations

For the visualizations, I recommend:
- **Recharts** - Easy to use, good for basic charts
- **D3.js** - For custom, interactive visualizations
- **Plotly.js** - For scientific/statistical plots
- **React Flow** - For network/turn sequence diagrams

## Turn Analysis Integration

### How Turns Connect to the Main Flow:

1. **From List Page**:
   - Click conversation → Detail Page
   - Detail Page has "Analyze Turns" button
   - Goes to Turn Analysis Page

2. **From Detail Page**:
   - Transcript section shows turn numbers
   - Click turn number → Jump to Turn Analysis, highlight that turn
   - Inline turn metrics (show response count badges)

3. **Turn-to-Turn Navigation**:
   - In transcript, show response links as clickable
   - Click response link → Jump to that turn
   - Visual indicators for high-response turns

### Advanced Features:

1. **Response Chains**:
   - Visualize full response trees
   - "Show all responses to this turn"
   - Collapse/expand response chains

2. **Cross-Conversation Turn Comparison**:
   - Compare high-response turns across conversations
   - "Find similar highly-responded turns"
   - Aggregate turn patterns by cluster

3. **Turn-Level Filters in Detail Page**:
   - Filter transcript to show only high-response turns
   - Highlight substantive vs mechanical turns
   - Show "conversation hotspots"

## Next Steps

### Immediate Priority Questions:

1. **Should I start with Phase 1** (routing & selection)?
   - This is the foundation for everything else
   - Gets navigation working between pages

2. **Which visualizations are most important?**
   - Turn sequence/timeline?
   - Response network graph?
   - UMAP cluster positions?
   - Speaker distributions?

3. **Turn analysis priority**:
   - Should turn analysis come after detail page (Phase 5)?
   - Or integrate it into the detail page from the start?

4. **Comparison metrics**:
   - What specific metrics matter most for comparing conversations?
   - What about comparing turns?

Let me know where you'd like to start, and I'll begin building!

