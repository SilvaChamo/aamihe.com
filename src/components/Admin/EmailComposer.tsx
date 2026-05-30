'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eye,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Type,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react';
import MediaModal from './MediaModal';
import { wrapMarketingEmailHtml, wrapPlainEmailHtml } from '@/lib/email-template';
import './EmailComposer.css';

type EditorMode = 'visual' | 'html' | 'preview';

type EmailComposerProps = {
  value: string;
  onChange: (html: string) => void;
  preheader?: string;
  subject?: string;
  disabled?: boolean;
  placeholder?: string;
  previewVariant?: 'marketing' | 'plain';
};

export default function EmailComposer({
  value,
  onChange,
  preheader = '',
  subject = '',
  disabled = false,
  placeholder = 'Escreva o conteúdo do e-mail…',
  previewVariant = 'marketing',
}: EmailComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [htmlSource, setHtmlSource] = useState(value);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  useEffect(() => {
    if (mode !== 'visual') {
      setHtmlSource(value);
      return;
    }
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value, mode]);

  const syncFromEditor = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback(
    (command: string, commandValue = '') => {
      if (disabled || mode !== 'visual') return;
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      syncFromEditor();
    },
    [disabled, mode, syncFromEditor],
  );

  const handleFormatChange = (block: string) => {
    execCommand('formatBlock', block);
  };

  const handleLink = () => {
    const url = prompt('URL do link:');
    if (url) execCommand('createLink', url);
  };

  const handleUnlink = () => execCommand('unlink');

  const handleImageSelect = (url: string) => {
    execCommand('insertImage', url);
    setIsMediaOpen(false);
  };

  const switchMode = (next: EditorMode) => {
    if (disabled) return;
    if (mode === 'visual' && next !== 'visual') {
      syncFromEditor();
      setHtmlSource(editorRef.current?.innerHTML || value);
    }
    if (mode === 'html' && next === 'visual') {
      onChange(htmlSource);
    }
    if (mode === 'html' && next !== 'html' && next !== 'visual') {
      onChange(htmlSource);
    }
    setMode(next);
  };

  const handleHtmlChange = (source: string) => {
    setHtmlSource(source);
    onChange(source);
  };

  const previewBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
  const wrapPreview =
    previewVariant === 'plain' ? wrapPlainEmailHtml : wrapMarketingEmailHtml;
  const previewHtml = wrapPreview(value || '<p></p>', preheader, previewBaseUrl);

  return (
    <>
      <div className="email-composer">
        <div className="email-composer-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'visual'}
            className={`email-composer-tab${mode === 'visual' ? ' is-active' : ''}`}
            onClick={() => switchMode('visual')}
            disabled={disabled}
          >
            Visual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'html'}
            className={`email-composer-tab${mode === 'html' ? ' is-active' : ''}`}
            onClick={() => switchMode('html')}
            disabled={disabled}
          >
            <Code size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
            HTML
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            className={`email-composer-tab${mode === 'preview' ? ' is-active' : ''}`}
            onClick={() => switchMode('preview')}
            disabled={disabled}
          >
            <Eye size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
            Pré-visualizar
          </button>
        </div>

        {mode !== 'preview' ? (
          <div className="email-composer-toolbar">
            <div className="email-composer-toolbar-group">
              <select
                className="email-composer-format-select"
                defaultValue=""
                disabled={disabled || mode !== 'visual'}
                onChange={(e) => {
                  if (e.target.value) handleFormatChange(e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="">Formato</option>
                <option value="p">Parágrafo</option>
                <option value="h1">Título 1</option>
                <option value="h2">Título 2</option>
                <option value="h3">Título 3</option>
                <option value="blockquote">Citação</option>
                <option value="pre">Pré-formatado</option>
              </select>
            </div>

            <span className="email-composer-toolbar-sep" aria-hidden />

            <div className="email-composer-toolbar-group">
              <button type="button" className="email-composer-toolbar-btn" title="Negrito" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('bold')}>
                <Bold size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Itálico" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('italic')}>
                <Italic size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Sublinhado" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('underline')}>
                <Underline size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Riscado" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('strikeThrough')}>
                <Strikethrough size={15} />
              </button>
            </div>

            <span className="email-composer-toolbar-sep" aria-hidden />

            <div className="email-composer-toolbar-group">
              <button type="button" className="email-composer-toolbar-btn" title="Citação" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('formatBlock', 'blockquote')}>
                <Quote size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Lista com marcas" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('insertUnorderedList')}>
                <List size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Lista numerada" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('insertOrderedList')}>
                <ListOrdered size={15} />
              </button>
            </div>

            <span className="email-composer-toolbar-sep" aria-hidden />

            <div className="email-composer-toolbar-group">
              <button type="button" className="email-composer-toolbar-btn" title="Alinhar à esquerda" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('justifyLeft')}>
                <AlignLeft size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Centrar" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('justifyCenter')}>
                <AlignCenter size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Alinhar à direita" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('justifyRight')}>
                <AlignRight size={15} />
              </button>
            </div>

            <span className="email-composer-toolbar-sep" aria-hidden />

            <div className="email-composer-toolbar-group">
              <button type="button" className="email-composer-toolbar-btn" title="Inserir link" disabled={disabled || mode !== 'visual'} onClick={handleLink}>
                <LinkIcon size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Remover link" disabled={disabled || mode !== 'visual'} onClick={handleUnlink}>
                <Unlink size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Inserir imagem" disabled={disabled || mode !== 'visual'} onClick={() => setIsMediaOpen(true)}>
                <ImageIcon size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Linha horizontal" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('insertHorizontalRule')}>
                <Minus size={15} />
              </button>
            </div>

            <span className="email-composer-toolbar-sep" aria-hidden />

            <div className="email-composer-toolbar-group">
              <button type="button" className="email-composer-toolbar-btn" title="Desfazer" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('undo')}>
                <Undo2 size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Refazer" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('redo')}>
                <Redo2 size={15} />
              </button>
              <button type="button" className="email-composer-toolbar-btn" title="Limpar formatação" disabled={disabled || mode !== 'visual'} onClick={() => execCommand('removeFormat')}>
                <Type size={15} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="email-composer-body">
          {mode === 'visual' ? (
            <div
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              className="email-composer-editor"
              data-placeholder={placeholder}
              onInput={syncFromEditor}
              onBlur={syncFromEditor}
            />
          ) : null}

          {mode === 'html' ? (
            <textarea
              className="email-composer-html"
              value={htmlSource}
              onChange={(e) => handleHtmlChange(e.target.value)}
              disabled={disabled}
              spellCheck={false}
            />
          ) : null}

          {mode === 'preview' ? (
            <div className="email-composer-preview-wrap">
              <iframe
                title={subject ? `Pré-visualização: ${subject}` : 'Pré-visualização do e-mail'}
                className="email-composer-preview-frame"
                srcDoc={previewHtml}
                sandbox=""
              />
            </div>
          ) : null}
        </div>

        <div className="email-composer-status">
          {mode === 'visual' && 'Modo visual — formate o texto com a barra de ferramentas.'}
          {mode === 'html' && 'Modo HTML — edite o código directamente.'}
          {mode === 'preview' && previewVariant === 'marketing' && 'Notificação avançada — pré-visualização com logotipo AAMIHE.'}
          {mode === 'preview' && previewVariant === 'plain' && 'Pré-visualização do e-mail normal.'}
        </div>
      </div>

      <MediaModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={handleImageSelect}
      />
    </>
  );
}
