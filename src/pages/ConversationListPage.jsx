import React, { useState } from 'react';
import { Container } from '@mui/material';
import ConversationFilters from '../components/ConversationFilters';
import ConversationTable from '../components/ConversationTable';
import { useConversationData, useConversationFilters } from '../hooks/useConversationData';

function ConversationListPage() {
  const { conversations, loading, availableGroups, availableSourceTypes } = useConversationData();
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterSourceType, setFilterSourceType] = useState('all');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedConversations = useConversationFilters(
    conversations,
    filterGroup,
    filterSourceType,
    orderBy,
    order
  );

  if (loading) {
    return null; // Loading handled by parent
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ConversationFilters
        totalConversations={conversations.length}
        filteredCount={filteredAndSortedConversations.length}
        filterGroup={filterGroup}
        setFilterGroup={setFilterGroup}
        filterSourceType={filterSourceType}
        setFilterSourceType={setFilterSourceType}
        availableGroups={availableGroups}
        availableSourceTypes={availableSourceTypes}
      />

      <ConversationTable
        conversations={filteredAndSortedConversations}
        orderBy={orderBy}
        order={order}
        onSort={handleSort}
      />
    </Container>
  );
}

export default ConversationListPage;

