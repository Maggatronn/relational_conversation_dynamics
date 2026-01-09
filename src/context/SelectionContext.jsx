import React, { createContext, useContext, useState } from 'react';

const SelectionContext = createContext();

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return context;
}

export function SelectionProvider({ children }) {
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);

  const toggleConversation = (conversationId) => {
    setSelectedConversationIds((prev) => {
      if (prev.includes(conversationId)) {
        return prev.filter((id) => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  const selectAll = (conversationIds) => {
    setSelectedConversationIds(conversationIds);
  };

  const clearSelection = () => {
    setSelectedConversationIds([]);
  };

  const isSelected = (conversationId) => {
    return selectedConversationIds.includes(conversationId);
  };

  const value = {
    selectedConversationIds,
    toggleConversation,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedConversationIds.length,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

