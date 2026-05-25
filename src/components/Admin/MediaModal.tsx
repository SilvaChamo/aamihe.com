'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { isImageUploadFile, uploadMediaFile } from '@/lib/persist-client-media';
import './MediaModal.css';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function MediaModal({ isOpen, onClose, onSelect }: MediaModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('upload');
      setIsDragging(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  };

  const processFile = async (file: File) => {
    if (!isImageUploadFile(file)) {
      alert('Seleccione um ficheiro de imagem (JPG, PNG, WebP, etc.).');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadMediaFile(file, 'Notícias');
      onSelect(url);
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Erro ao carregar imagem. Tente novamente.';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal-header">
          <div className="media-modal-tabs">
            <button
              type="button"
              className={`media-modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Carregar ficheiros
            </button>
            <button
              type="button"
              className={`media-modal-tab ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              Biblioteca multimédia
            </button>
          </div>
          <button type="button" className="media-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="media-modal-file-input"
          accept="image/*"
          onChange={handleFileUpload}
          tabIndex={-1}
          aria-hidden
        />

        <div className="media-modal-content">
          {activeTab === 'upload' ? (
            <div
              className={`media-upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="media-upload-box">
                {isUploading ? (
                  <div className="media-upload-progress">
                    <div className="media-upload-spinner"></div>
                    <p>A carregar imagem...</p>
                  </div>
                ) : (
                  <>
                    <div className="media-upload-icon-circle">
                      <Upload size={48} className="media-upload-icon" />
                    </div>
                    <h3>Largue os ficheiros para carregar</h3>
                    <p>ou</p>
                    <button type="button" className="media-upload-button" onClick={openFilePicker}>
                      Selecionar ficheiros
                    </button>
                    <p className="media-upload-limit">Tamanho máximo do ficheiro: 512 MB.</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="media-library-wrapper">
              <MediaLibrary
                isModal={true}
                onSelect={(url) => {
                  onSelect(url);
                  onClose();
                }}
              />
            </div>
          )}
        </div>

        <div className="media-modal-footer">
          <div className="media-modal-footer-left">
            {activeTab === 'library' && (
              <p className="media-selection-info">Clique numa imagem para a inserir na notícia.</p>
            )}
          </div>
          <div className="media-modal-footer-right">
            <button type="button" className="media-button-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
