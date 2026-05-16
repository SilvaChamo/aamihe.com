'use client';

import React, { useState } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
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

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Simulate network delay for "premium" feel (progress bar or spinner)
      setTimeout(() => {
        onSelect(ev.target?.result as string);
        setIsUploading(false);
        onClose();
      }, 800);
    };
    reader.readAsDataURL(file);
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
      processFile(file);
    }
  };

  return (
    <div className="media-modal-overlay">
      <div className="media-modal-container">
        <div className="media-modal-header">
          <div className="media-modal-tabs">
            <button 
              className={`media-modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Carregar ficheiros
            </button>
            <button 
              className={`media-modal-tab ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              Biblioteca multimédia
            </button>
          </div>
          <button className="media-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

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
                    <label className="media-upload-button">
                      Selecionar ficheiros
                      <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                    </label>
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
              <p className="media-selection-info">Selecione uma imagem da biblioteca para continuar.</p>
            )}
          </div>
          <div className="media-modal-footer-right">
            <button className="media-button-secondary" onClick={onClose}>Cancelar</button>
            {activeTab === 'library' && (
              <button className="media-button-primary disabled">Inserir na notícia</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
