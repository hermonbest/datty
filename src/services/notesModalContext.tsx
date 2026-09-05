import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NotesScreen } from '../features/notes/NotesScreen';
import { registerGlobalOpenNotes } from './notificationNavigation';

export type NoteTabKey = 'gratitude' | 'list' | 'partner';

interface NotesModalContextType {
  openNotes: (tab?: NoteTabKey) => void;
  closeNotes: () => void;
  isNotesOpen: boolean;
}

const NotesModalContext = createContext<NotesModalContextType>({
  openNotes: () => {},
  closeNotes: () => {},
  isNotesOpen: false,
});

export const useNotesModal = () => useContext(NotesModalContext);

export const NotesModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<NoteTabKey>('gratitude');

  const openNotes = useCallback((tab?: NoteTabKey) => {
    if (tab) {
      setActiveTab(tab);
    }
    setVisible(true);
  }, []);

  const closeNotes = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    registerGlobalOpenNotes(openNotes);
    return () => {
      registerGlobalOpenNotes(null);
    };
  }, [openNotes]);

  return (
    <NotesModalContext.Provider value={{ openNotes, closeNotes, isNotesOpen: visible }}>
      {children}
      {visible && (
        <NotesScreen
          visible={visible}
          initialTab={activeTab}
          onClose={closeNotes}
        />
      )}
    </NotesModalContext.Provider>
  );
};
