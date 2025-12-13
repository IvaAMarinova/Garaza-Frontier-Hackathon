/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { MindMap, ChatInput } from '@garaza-frontier/chat-board/chat-board';
import '@garaza-frontier/chat-board/chat-board/styles.css';

export default function ChatBoardWrapper() {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isDarkMode] = useState(false);

  const handleChatSubmit = (message) => {
    setUserInput(message);
    setHasSubmitted(true);
  };

  return (
    <div className="chat-board-container" style={{ isolation: 'isolate', minHeight: '100vh', position: 'relative' }}>
      {hasSubmitted && <MindMap initialText={userInput} isDarkMode={isDarkMode} />}
      <ChatInput 
        onSend={handleChatSubmit} 
        isCentered={!hasSubmitted}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

