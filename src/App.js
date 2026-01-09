import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Container,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import theme from './theme';
import PageLayout from './components/layout/PageLayout';
import { SelectionProvider } from './context/SelectionContext';
import { useConversationData } from './hooks/useConversationData';
import ConversationListPage from './pages/ConversationListPage';
import ConversationDetailPage from './pages/ConversationDetailPage';
import ConversationComparePage from './pages/ConversationComparePage';
import TurnAnalysisPage from './pages/TurnAnalysisPage';

function AppContent() {
  const { loading } = useConversationData();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#d4704c' }} />
      </Container>
    );
  }

  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<ConversationListPage />} />
        <Route path="/conversation/:id" element={<ConversationDetailPage />} />
        <Route path="/compare" element={<ConversationComparePage />} />
        <Route path="/turns/:conversationId" element={<TurnAnalysisPage />} />
      </Routes>
    </PageLayout>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <SelectionProvider>
          <AppContent />
        </SelectionProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
