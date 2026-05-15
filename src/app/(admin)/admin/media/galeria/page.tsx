'use client';

import React from 'react';
import { Plus, Grid, List, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react';
import '../media.css';

const galleryImages = [
  { id: 1, name: 'Tiago Caungo Mutombo', src: '/gallery/3-Tiago-Caungo-Mutombo-Vice-President-Lusophone-compressed-scaled.jpg.webp', category: 'Liderança' },
  { id: 2, name: 'Rene Gnalega', src: '/gallery/4-Rene-Gnalega-Vice-President-Francophone-compressed-scaled.jpg.webp', category: 'Liderança' },
  { id: 3, name: 'Yar Donlah Gonway Gono', src: '/gallery/5-Yar-Donlah-Gonway-Gono-Vice-President-Anglophone-compressed-scaled.jpg.webp', category: 'Liderança' },
  { id: 4, name: 'Peter Mageto', src: '/gallery/6-Peter-Mageto-Secretary-compressed-scaled.jpg.webp', category: 'Liderança' },
  { id: 5, name: 'Jamisse Taimo', src: '/gallery/7-Jamisse-Taimo-Consultants-Executive-Officer-compressed-scaled.jpg.webp', category: 'Liderança' },
  { id: 6, name: 'Tukumbi Lumumba Kasongo', src: '/gallery/9-Tukumbi-Lumumba-Kasongo-Consultants-compressed-scaled.jpg.webp', category: 'Liderança' },
  { id: 7, name: 'President Kongolo Chijika', src: '/gallery/President-Kongolo-Chijika-1.jpg.webp', category: 'Liderança' },
  { id: 8, name: 'Vice-President Anglophone', src: '/gallery/Vice-President-Anglophone-Rosemary.jpg.webp', category: 'Liderança' },
  { id: 9, name: 'Ocean Acidification Training', src: '/gallery/Ocean-acidification-training.jpeg.webp', category: 'Eventos' },
  { id: 10, name: 'Evento AAMIHE 1', src: '/gallery/647268264_1204088871880282_9104226780545651263_n.jpg', category: 'Eventos' },
  { id: 11, name: 'Evento AAMIHE 2', src: '/gallery/647704531_1204895398466296_3711846847153028344_n.jpg', category: 'Eventos' },
  { id: 12, name: 'Evento AAMIHE 3', src: '/gallery/648985636_1205610048394831_7145794994169769278_n.jpg', category: 'Eventos' },
  { id: 13, name: 'Evento AAMIHE 4', src: '/gallery/665869693_1605095437427935_5862029230954093158_n.jpg', category: 'Eventos' },
  { id: 14, name: 'Evento AAMIHE 5', src: '/gallery/696961631_1258292909793211_21745030036662716_n.jpg', category: 'Eventos' },
  { id: 15, name: 'Background Notícias', src: '/gallery/BgNoticias.jpeg', category: 'Design' },
];

export default function GalleryPage() {
  return (
    <div className="media-page">
      <div className="media-header">
        <h1 className="media-title">Galeria</h1>
        <div className="media-actions">
          <button className="media-button secondary">
            <List className="media-button-icon" />
            Lista
          </button>
          <button className="media-button secondary active">
            <Grid className="media-button-icon" />
            Grelha
          </button>
          <button className="media-button primary">
            <Plus className="media-button-icon" />
            Adicionar à Galeria
          </button>
        </div>
      </div>

      <div className="gallery-filters">
        <select className="upload-select">
          <option>Todas as Categorias</option>
          <option>Liderança</option>
          <option>Eventos</option>
          <option>Design</option>
        </select>
        <select className="upload-select">
          <option>Ordenar por: Mais recentes</option>
          <option>Ordenar por: Mais antigas</option>
          <option>Ordenar por: Nome A-Z</option>
          <option>Ordenar por: Nome Z-A</option>
        </select>
      </div>

      <div className="gallery-grid">
        {galleryImages.map((image) => (
          <div key={image.id} className="gallery-item">
            <div className="gallery-item-image">
              <img 
                src={image.src} 
                alt={image.name}
                className="gallery-img"
              />
            </div>
            <div className="gallery-item-info">
              <h4 className="gallery-item-title">{image.name}</h4>
              <p className="gallery-item-meta">{image.category}</p>
              <div className="gallery-item-actions">
                <button className="gallery-action-button">
                  <Edit2 className="gallery-action-icon" />
                  Editar
                </button>
                <button className="gallery-action-button">
                  <Trash2 className="gallery-action-icon" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
