'use client';

import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Type } from 'lucide-react';

interface VisualEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function VisualEditor({ value, onChange, placeholder }: VisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sincronizar o conteúdo de forma estável
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="visual-editor-container" style={{ border: '1px solid #ccd0d4', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="editor-toolbar" style={{ 
        display: 'flex', 
        gap: '10px', 
        padding: '10px', 
        background: '#fcf9f9', 
        borderBottom: '1px solid #ccd0d4' 
      }}>
        <button type="button" onClick={() => execCommand('bold')} className="toolbar-btn" title="Negrito"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="toolbar-btn" title="Itálico"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand('formatBlock', 'h2')} className="toolbar-btn" title="Título 2">H2</button>
        <button type="button" onClick={() => execCommand('formatBlock', 'h3')} className="toolbar-btn" title="Título 3">H3</button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn" title="Lista"><List size={16} /></button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="toolbar-btn" title="Lista Numerada"><ListOrdered size={16} /></button>
        <button type="button" onClick={() => {
          const url = prompt('Insira o URL:');
          if (url) execCommand('createLink', url);
        }} className="toolbar-btn" title="Link"><LinkIcon size={16} /></button>
        <button type="button" onClick={() => execCommand('removeFormat')} className="toolbar-btn" title="Limpar Formatação"><Type size={16} /></button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="editor-content"
        style={{ 
          minHeight: '400px', 
          padding: '15px', 
          outline: 'none', 
          background: '#fff',
          fontFamily: 'inherit',
          lineHeight: '1.6',
          fontSize: '15px'
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        .toolbar-btn {
          background: #fff;
          border: 1px solid #ccd0d4;
          border-radius: 3px;
          padding: 4px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #561713;
          transition: all 0.2s;
        }
        .toolbar-btn:hover {
          background: #f0f0f1;
          border-color: #561713;
        }
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #8c8f94;
        }
      `}</style>
    </div>
  );
}
