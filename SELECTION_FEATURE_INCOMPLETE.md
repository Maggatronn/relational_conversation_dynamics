# Selection Feature - In Progress

## What's Been Completed

### Timeline Click Handlers ✅
- Timeline segments now pass detailed data when clicked including:
  - Turn number, speaker, segment text
  - Target turn info (for responses)
  - Linked words being responded to
  - Response type (substantive/mechanical)
- Background click clears selection
- `e.stopPropagation()` prevents bubbling

### Page-Level State ✅
- `ConversationDetailPage` now manages `selectedSegment` state
- `handleSegmentClick` sets the selected segment
- `handleClearSelection` clears it

## What Still Needs to Be Done

### TranscriptViewer Updates Needed

The `TranscriptViewer` component needs significant updates to:

1. **Accept new props:**
   - `selectedSegment` - the clicked segment data
   - `onClearSelection` - callback to clear

2. **Scroll to selected turn:**
   - When `selectedSegment` changes, scroll to `selectedSegment.turnNumber`
   - Highlight that turn

3. **Highlight target turn (if response):**
   - If `selectedSegment.isResponse`, also highlight `selectedSegment.targetTurnNumber`
   - Different highlight color to distinguish source vs target

4. **Add overlay at top showing relationship:**
   ```jsx
   {selectedSegment && selectedSegment.isResponse && (
     <Box sx={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff', p: 2, borderBottom: '2px solid #43aa8b' }}>
       <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
         <Box>
           <Typography variant="caption">Response:</Typography>
           <Typography variant="body2">{selectedSegment.text}</Typography>
         </Box>
         <ArrowForward />
         <Box>
           <Typography variant="caption">Responding to:</Typography>
           <Typography variant="body2">
             {/* Show linkedWords highlighted within targetText */}
           </Typography>
         </Box>
         <IconButton onClick={onClearSelection}><Close /></IconButton>
       </Box>
     </Box>
   )}
   ```

5. **Highlight logic in transcript:**
   - Add conditional styling to turn boxes
   - If `turn.turnNumber === selectedSegment.turnNumber`: highlight green
   - If `turn.turnNumber === selectedSegment.targetTurnNumber`: highlight blue/teal
   - Within the target turn text, bold/highlight the `linkedWords`

6. **Clear button:**
   - X button in overlay
   - Or click anywhere in transcript to clear

## Suggested Implementation

Since the TranscriptViewer is getting complex, consider:
- Extract overlay into separate component: `ResponseOverlay.jsx`
- Create helper function to highlight linked words within text
- Use refs to scroll both turns into view if they're far apart

## Next Steps

Would you like me to:
1. Complete the TranscriptViewer updates?
2. Create the overlay component?
3. Test the full flow?

