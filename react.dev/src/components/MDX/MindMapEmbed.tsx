/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import { MindMap } from '@garaza-frontier/chat-board/chat-board';
import '@garaza-frontier/chat-board/chat-board/styles.css';

interface MindMapEmbedProps {
  initialText?: string;
  height?: string;
}

export default function MindMapEmbed({ 
  initialText = "React Concepts",
  height = "600px" 
}: MindMapEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      // Hide body scroll when fullscreen
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          background: 'white',
          transform: 'none', // Reset any inherited transforms
          zoom: 'normal', // Reset any zoom
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10000,
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '12px', color: '#666' }}>
            Press ESC to exit
          </span>
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '8px 16px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Exit Fullscreen
          </button>
        </div>
        <div style={{
          width: '100%',
          height: '100%',
          transform: 'none',
          zoom: 'normal',
          fontSize: '16px'
        }}>
          <MindMap initialText={initialText} />
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors shadow-sm"
          >
            🔍 Fullscreen
          </button>
        </div>
        <div style={{ 
          height, 
          width: '100%',
          transform: 'none', // Reset any inherited transforms
          zoom: 'normal', // Reset any zoom
          fontSize: '16px', // Reset font size
          position: 'relative'
        }}>
          <MindMap initialText={initialText} />
        </div>
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        <p>
          <strong>💡 Interactive Mind Map:</strong> Click the fullscreen button above for the best experience. 
          You can drag nodes around, zoom in/out with mouse wheel, and explore React concepts interactively.
        </p>
        <p className="mt-2">
          <strong>🎯 Controls:</strong> Drag nodes • Scroll to zoom • Pan background • ESC to exit fullscreen
        </p>
      </div>
    </div>
  );
}