'use client';

import React, { useState } from 'react';
import { Save, Shield, CheckCircle, Loader2, ChevronDown } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  STAFF_MENU_KEYS,
  STAFF_MENU_LABELS,
  STAFF_SUBMENU_ITEMS,
  SUBSCRIBER_MENU_KEYS,
  SUBSCRIBER_MENU_LABELS,
  SUBSCRIBER_SUBMENU_ITEMS,
  SUBSCRIBER_ADMIN_EXTRA_KEYS,
  defaultMenuPrivileges,
  menuSubPrivilegeKey,
  resolveMenuPrivileges,
  type MenuPrivilegesConfig,
  type StaffMenuKey,
  type SubscriberAdminExtraKey,
  type SubscriberMenuKey,
} from '@/lib/menu-privileges';
import '../definicoes/definicoes.css';
import './privilegios.css';

const DEFAULTS = {
  menuPrivileges: defaultMenuPrivileges(),
};

function ToggleRow({
  title,
  checked,
  onChange,
  nested,
  disabled = false,
}: {
  title: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
  nested?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`switch-field-row privileges-toggle-row${nested ? ' privileges-sub-row' : ''}${disabled ? ' privileges-row-disabled' : ''}`}
    >
      <div className="switch-field-label">
        <p className={`switch-title${nested ? ' privileges-sub-title' : ''}`}>{title}</p>
      </div>
      <label className={`ios-toggle-switch${disabled ? ' is-disabled' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="ios-toggle-slider" />
      </label>
    </div>
  );
}

function PrivilegesCollapse({
  open,
  className = '',
  children,
}: {
  open: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`privileges-collapse${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
      <div className="privileges-collapse-inner">{children}</div>
    </div>
  );
}

function MenuPrivilegeGroup({
  title,
  checked,
  onToggle,
  children,
  disabled = false,
}: {
  title: string;
  checked: boolean;
  onToggle: (enabled: boolean) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const hasChildren = React.Children.count(children) > 0;
  const [open, setOpen] = useState(false);

  return (
    <div className="privileges-menu-group">
      <div className="switch-field-row privileges-toggle-row privileges-parent-row">
        <div className="privileges-parent-left">
          {hasChildren ? (
            <button
              type="button"
              className="privileges-expand-btn"
              aria-expanded={open}
              aria-label={open ? 'Ocultar submenus' : 'Mostrar submenus'}
              onClick={() => setOpen((prev) => !prev)}
            >
              <ChevronDown className={`privileges-expand-icon${open ? ' open' : ''}`} />
            </button>
          ) : (
            <span className="privileges-expand-spacer" aria-hidden />
          )}
          <div className="switch-field-label">
            <p className="switch-title">{title}</p>
          </div>
        </div>
        <label className={`ios-toggle-switch${disabled ? ' is-disabled' : ''}`}>
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="ios-toggle-slider" />
        </label>
      </div>
      {hasChildren ? (
        <PrivilegesCollapse open={open}>
          <div className="privileges-children">{children}</div>
        </PrivilegesCollapse>
      ) : null}
    </div>
  );
}

function AdminExtrasSection({
  enabled,
  onEnabledChange,
  children,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="privileges-admin-extras-section">
      <div className="switch-field-row privileges-toggle-row privileges-section-master-row">
        <div className="privileges-parent-left">
          <button
            type="button"
            className="privileges-expand-btn"
            aria-expanded={open}
            aria-label={open ? 'Ocultar opções do administrador' : 'Mostrar opções do administrador'}
            onClick={() => setOpen((prev) => !prev)}
          >
            <ChevronDown className={`privileges-expand-icon${open ? ' open' : ''}`} />
          </button>
          <div className="privileges-section-heading">
            <h3>Opções do administrador</h3>
            <p>Ao activar, aparecem no painel subscritor com a etiqueta «Novo»</p>
          </div>
        </div>
        <label className="ios-toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          <span className="ios-toggle-slider" />
        </label>
      </div>
      <PrivilegesCollapse open={open}>
        <div className={`privileges-admin-extras-body${enabled ? '' : ' is-disabled'}`}>
          {children}
        </div>
      </PrivilegesCollapse>
    </div>
  );
}

export default function PrivilegiosPage() {
  const { settings, setSettings, loading, saving, savedAt, error, save } = useSettings(DEFAULTS);

  const privileges = settings.menuPrivileges as MenuPrivilegesConfig;

  const toggleStaff = (key: StaffMenuKey, enabled: boolean) => {
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        editor: { ...privileges?.editor, [key]: enabled },
      },
    });
  };

  const toggleStaffSub = (parent: StaffMenuKey, childKey: string, enabled: boolean) => {
    const subKey = menuSubPrivilegeKey(parent, childKey);
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        editorSub: { ...privileges?.editorSub, [subKey]: enabled },
      },
    });
  };

  const toggleSubscriber = (key: SubscriberMenuKey, enabled: boolean) => {
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        subscriber: { ...privileges?.subscriber, [key]: enabled },
      },
    });
  };

  const toggleSubscriberSub = (parent: SubscriberMenuKey, childKey: string, enabled: boolean) => {
    const subKey = menuSubPrivilegeKey(parent, childKey);
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        subscriberSub: { ...privileges?.subscriberSub, [subKey]: enabled },
      },
    });
  };

  const toggleSubscriberAdminExtrasMaster = (enabled: boolean) => {
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        subscriberAdminExtrasEnabled: enabled,
      },
    });
  };

  const toggleSubscriberAdminExtra = (key: SubscriberAdminExtraKey, enabled: boolean) => {
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        subscriberAdminExtras: { ...privileges?.subscriberAdminExtras, [key]: enabled },
      },
    });
  };

  const toggleSubscriberAdminExtraSub = (
    parent: SubscriberAdminExtraKey,
    childKey: string,
    enabled: boolean,
  ) => {
    const subKey = menuSubPrivilegeKey(parent, childKey);
    setSettings({
      ...settings,
      menuPrivileges: {
        ...privileges,
        subscriberAdminExtrasSub: { ...privileges?.subscriberAdminExtrasSub, [subKey]: enabled },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mergedPrivileges = resolveMenuPrivileges({ menuPrivileges: privileges });
    await save({ menuPrivileges: mergedPrivileges } as typeof DEFAULTS);
  };

  const adminExtrasEnabled = privileges?.subscriberAdminExtrasEnabled === true;

  return (
    <div className="settings-container">
      <form onSubmit={handleSubmit}>
        <div className="settings-header">
          <div className="settings-title-group">
            <h1>Privilégios de menu</h1>
            <p>Active ou desactive itens da barra lateral do painel editor e do subscritor</p>
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
            <button type="submit" className="btn-save-settings" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="privileges-panels-row">
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2>
                <Shield /> Painel editor (staff)
              </h2>
            </div>
            <div className="settings-panel-body">
              {STAFF_MENU_KEYS.map((key) => {
                const children = STAFF_SUBMENU_ITEMS[key];
                return (
                  <MenuPrivilegeGroup
                    key={key}
                    title={STAFF_MENU_LABELS[key]}
                    checked={privileges?.editor?.[key] !== false}
                    onToggle={(enabled) => toggleStaff(key, enabled)}
                  >
                    {children?.map((child) => (
                      <ToggleRow
                        key={child.key}
                        title={child.label}
                        checked={
                          privileges?.editorSub?.[menuSubPrivilegeKey(key, child.key)] !== false
                        }
                        onChange={(enabled) => toggleStaffSub(key, child.key, enabled)}
                        nested
                      />
                    ))}
                  </MenuPrivilegeGroup>
                );
              })}
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2>
                <Shield /> Painel subscritor
              </h2>
            </div>
            <div className="settings-panel-body">
              {SUBSCRIBER_MENU_KEYS.map((key) => {
                const children = SUBSCRIBER_SUBMENU_ITEMS[key];
                return (
                  <MenuPrivilegeGroup
                    key={key}
                    title={SUBSCRIBER_MENU_LABELS[key]}
                    checked={privileges?.subscriber?.[key] !== false}
                    onToggle={(enabled) => toggleSubscriber(key, enabled)}
                  >
                    {children?.map((child) => (
                      <ToggleRow
                        key={child.key}
                        title={child.label}
                        checked={
                          privileges?.subscriberSub?.[menuSubPrivilegeKey(key, child.key)] !==
                          false
                        }
                        onChange={(enabled) => toggleSubscriberSub(key, child.key, enabled)}
                        nested
                      />
                    ))}
                  </MenuPrivilegeGroup>
                );
              })}

              <AdminExtrasSection
                enabled={adminExtrasEnabled}
                onEnabledChange={toggleSubscriberAdminExtrasMaster}
              >
                {SUBSCRIBER_ADMIN_EXTRA_KEYS.map((key) => {
                  const children = STAFF_SUBMENU_ITEMS[key];
                  return (
                    <MenuPrivilegeGroup
                      key={key}
                      title={STAFF_MENU_LABELS[key]}
                      checked={privileges?.subscriberAdminExtras?.[key] === true}
                      onToggle={(enabled) => toggleSubscriberAdminExtra(key, enabled)}
                      disabled={!adminExtrasEnabled}
                    >
                      {children?.map((child) => (
                        <ToggleRow
                          key={child.key}
                          title={child.label}
                          checked={
                            privileges?.subscriberAdminExtrasSub?.[
                              menuSubPrivilegeKey(key, child.key)
                            ] !== false
                          }
                          onChange={(enabled) =>
                            toggleSubscriberAdminExtraSub(key, child.key, enabled)
                          }
                          nested
                          disabled={!adminExtrasEnabled}
                        />
                      ))}
                    </MenuPrivilegeGroup>
                  );
                })}
              </AdminExtrasSection>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
