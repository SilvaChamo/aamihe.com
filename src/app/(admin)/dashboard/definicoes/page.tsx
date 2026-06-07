'use client';

import React, { useEffect, useState } from 'react';
import {
  Globe,
  Save,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Loader2,
  Share2,
} from 'lucide-react';
import Image from 'next/image';
import { adminFetch } from '@/lib/admin-auth';
import {
  DEFAULT_FAVICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_SITE_GENERAL_CONFIG,
  generalConfigToSettingsPayload,
  settingsToGeneralConfig,
  type SiteGeneralConfig,
} from '@/lib/site-general-config';
import type { SiteSettingsPayload } from '@/lib/supabase-settings';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { useSettings } from '@/hooks/useSettings';
import './definicoes.css';

type ImageFieldProps = {
  label: string;
  value: string;
  fallback: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  previewHeight?: number;
  previewSquare?: boolean;
};

function ImageAssetField({
  label,
  value,
  fallback,
  uploading,
  onUpload,
  previewHeight = 72,
  previewSquare = false,
}: ImageFieldProps) {
  const previewSrc = resolveAvatarUrl(value) || fallback;

  return (
    <div className="form-field-group site-asset-field">
      <label>{label}</label>
      <div className={`site-asset-preview ${previewSquare ? 'site-asset-preview--square' : ''}`}>
        <Image
          src={previewSrc}
          alt={label}
          width={previewSquare ? 64 : 200}
          height={previewSquare ? 64 : previewHeight}
          className="site-asset-preview-image"
          unoptimized
        />
      </div>
      <label className="site-asset-upload-btn">
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 spin" /> A carregar…
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4" /> Alterar imagem
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="screen-reader-text"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

export default function DefinicoesGeraisPage() {
  const {
    settings: fullSettings,
    loading,
    saving,
    savedAt,
    error,
    save,
  } = useSettings<SiteSettingsPayload>({});

  const [general, setGeneral] = useState<SiteGeneralConfig>(DEFAULT_SITE_GENERAL_CONFIG);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    setGeneral(settingsToGeneralConfig(fullSettings));
  }, [loading, fullSettings]);

  const uploadImage = async (file: File, field: keyof SiteGeneralConfig) => {
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'site-assets');
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Erro no upload');
      }
      setGeneral((prev) => ({ ...prev, [field]: data.url as string }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = generalConfigToSettingsPayload(general, fullSettings);
    await save(payload as SiteSettingsPayload);
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSubmit}>
        <div className="settings-header">
          <div className="settings-title-group">
            <h1>Definições Gerais</h1>
            <p>Configure as informações básicas do site — sincronizado com o site público</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {savedAt && !saving && (
              <span className="settings-saved-badge">
                <CheckCircle size={14} /> Guardado
              </span>
            )}
            {error && <span className="settings-error-badge">{error}</span>}
            {loading && (
              <span className="settings-saved-badge" style={{ opacity: 0.75 }}>
                <Loader2 className="w-4 h-4 spin" /> A sincronizar…
              </span>
            )}
            <button type="submit" className="btn-save-settings" disabled={saving || loading}>
              {saving ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="settings-layout-stack">
          {/* Secção 1 — dois cards */}
          <div className="settings-cards-row">
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Globe /> Informações do Site
                </h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>Nome do Site</label>
                  <input
                    type="text"
                    value={general.siteName}
                    onChange={(e) => setGeneral({ ...general, siteName: e.target.value })}
                    className="form-input-text"
                  />
                </div>
                <div className="form-field-group">
                  <label>Descrição</label>
                  <textarea
                    value={general.siteDescription}
                    onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <ImageIcon /> Identidade do site
                </h2>
              </div>
              <div className="settings-panel-body">
                <div className="settings-identity-row">
                  <ImageAssetField
                    label="Logotipo"
                    value={general.logoUrl}
                    fallback={DEFAULT_LOGO_URL}
                    uploading={uploadingField === 'logoUrl'}
                    onUpload={(file) => uploadImage(file, 'logoUrl')}
                  />
                  <ImageAssetField
                    label="Favicon"
                    value={general.faviconUrl}
                    fallback={DEFAULT_FAVICON_URL}
                    uploading={uploadingField === 'faviconUrl'}
                    onUpload={(file) => uploadImage(file, 'faviconUrl')}
                    previewSquare
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Secção 2 — dois cards */}
          <div className="settings-cards-row">
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Mail /> Contactos
                </h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>
                    <Mail className="w-4 h-4" /> Email
                  </label>
                  <input
                    type="email"
                    value={general.contactEmail}
                    onChange={(e) => setGeneral({ ...general, contactEmail: e.target.value })}
                    className="form-input-text"
                  />
                </div>
                <div className="form-field-group">
                  <label>
                    <Phone className="w-4 h-4" /> Telefone
                  </label>
                  <input
                    type="tel"
                    value={general.contactPhone}
                    onChange={(e) => setGeneral({ ...general, contactPhone: e.target.value })}
                    className="form-input-text"
                  />
                </div>
                <div className="form-field-group">
                  <label>
                    <MapPin className="w-4 h-4" /> Endereço
                  </label>
                  <input
                    type="text"
                    value={general.address}
                    onChange={(e) => setGeneral({ ...general, address: e.target.value })}
                    className="form-input-text"
                  />
                </div>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Share2 /> Redes sociais
                </h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>X (Twitter)</label>
                  <input
                    type="url"
                    value={general.socialLinks.twitter}
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        socialLinks: { ...general.socialLinks, twitter: e.target.value },
                      })
                    }
                    className="form-input-text"
                    placeholder="https://"
                  />
                </div>
                <div className="form-field-group">
                  <label>Facebook</label>
                  <input
                    type="url"
                    value={general.socialLinks.facebook}
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        socialLinks: { ...general.socialLinks, facebook: e.target.value },
                      })
                    }
                    className="form-input-text"
                    placeholder="https://"
                  />
                </div>
                <div className="form-field-group">
                  <label>Instagram</label>
                  <input
                    type="url"
                    value={general.socialLinks.instagram}
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        socialLinks: { ...general.socialLinks, instagram: e.target.value },
                      })
                    }
                    className="form-input-text"
                    placeholder="https://"
                  />
                </div>
                <div className="form-field-group">
                  <label>LinkedIn</label>
                  <input
                    type="url"
                    value={general.socialLinks.linkedin}
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        socialLinks: { ...general.socialLinks, linkedin: e.target.value },
                      })
                    }
                    className="form-input-text"
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
