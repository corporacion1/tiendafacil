"use client";

import React from 'react';
import QRCode from 'qrcode';
import { Facebook, Twitter, Instagram, MessageCircle, Building2, ShoppingBag, FileText, Award } from 'lucide-react';
import type { QuoteTemplateProps, PaletteColors } from './types';
import { QuoteWatermark } from './quote-watermark';
import { QuoteSignature } from './quote-signature';
import type { Store } from '@/lib/types';

export function QuoteTemplates(props: QuoteTemplateProps) {
  const { template, settings, cartItems, customer, saleId, options, subtotal, totalItems, tax1Amount, tax2Amount, total, qrCodeUrl } = props;

  const colors: PaletteColors = {
    primary: 'rgb(71, 85, 105)',
    primaryLight: 'rgb(148, 163, 184)',
    accent: 'rgb(245, 158, 11)',
    accentLight: 'rgb(251, 191, 36)',
    background: 'rgb(255, 255, 255)',
    text: 'rgb(17, 24, 39)',
    textMuted: 'rgb(107, 114, 128)',
    border: 'rgb(229, 231, 235)',
  };

  const whatsappLink = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : '';
  const facebookLink = settings?.meta ? `https://facebook.com/${settings.meta.replace(/facebook\.com\//, '')}` : '';
  const tiktokLink = settings?.tiktok ? `https://tiktok.com/@${settings.tiktok.replace(/@/, '')}` : '';

  if (template === 'minimalist') {
    return (
      <div className="quote-document" style={{
        fontFamily: 'Georgia, serif',
        padding: '30px',
        margin: '0',
        color: colors.text,
        backgroundColor: colors.background,
        position: 'relative',
        minHeight: 'auto',
      }}>
        {options.showWatermark && settings?.logoUrl && (
          <QuoteWatermark logoUrl={settings.logoUrl} />
        )}

        <div className="quote-header" style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            letterSpacing: '1px',
          }}>
            {settings?.name.toUpperCase()}
          </h1>
          <p style={{ fontSize: '11px', margin: '4px 0', color: colors.textMuted }}>
            {settings?.taxId || settings?.nitId} | {settings?.phone}
          </p>
          <p style={{ fontSize: '11px', margin: '4px 0', color: colors.textMuted }}>
            {settings?.address}
          </p>
        </div>

        <div className="quote-title" style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: colors.background,
          borderRadius: '4px'
        }}>
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: colors.primary
          }}>
            COTIZACIÓN #{saleId}
          </h2>
          <p style={{ fontSize: '13px', margin: '6px 0 0 0', color: colors.textMuted }}>
            Fecha: {new Date().toLocaleDateString()} | Válido por: {options.validDays} días
          </p>
        </div>

        {customer && (
          <div className="customer-section" style={{
            marginBottom: '20px',
            padding: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px'
          }}>
            <h3 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              color: colors.primary
            }}>
              Cliente
            </h3>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <p style={{ margin: '3px 0' }}><strong>Nombre:</strong> {customer.name}</p>
              {(customer as any).rif_nit && <p style={{ margin: '3px 0' }}><strong>RIF:</strong> {(customer as any).rif_nit}</p>}
              {customer.phone && <p style={{ margin: '3px 0' }}><strong>Teléfono:</strong> {customer.phone}</p>}
              {(customer as any).address && <p style={{ margin: '3px 0' }}><strong>Dirección:</strong> {(customer as any).address}</p>}
            </div>
          </div>
        )}

        <div className="products-section" style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            color: colors.primary
          }}>
            Detalle de Productos
          </h3>

          <div className="products-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cartItems.map((item, index) => (
              <div key={item.product.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: '1px dashed ' + colors.border,
                gap: '20px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    margin: '0 0 3px 0',
                    fontWeight: '500'
                  }}>
                    {item.product.name}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    margin: 0,
                    color: colors.textMuted
                  }}>
                    {item.quantity} x {settings?.primaryCurrencySymbol}{item.price.toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px', minWidth: '80px' }}>
                  {settings?.primaryCurrencySymbol}{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="totals-section" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '20px'
        }}>
          <div style={{ width: '320px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '13px'
            }}>
              <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'}):</span>
              <span>{settings?.primaryCurrencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {settings?.tax1 && tax1Amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '13px'
              }}>
                <span>Impuesto ({settings.tax1}%):</span>
                <span>{settings?.primaryCurrencySymbol}{tax1Amount.toFixed(2)}</span>
              </div>
            )}
            {settings?.tax2 && tax2Amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '13px'
              }}>
                <span>Impuesto ({settings.tax2}%):</span>
                <span>{settings?.primaryCurrencySymbol}{tax2Amount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '2px solid ' + colors.primary,
              fontSize: '17px',
              fontWeight: 'bold',
              color: colors.primary
            }}>
              <span>TOTAL:</span>
              <span>{settings?.primaryCurrencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {options.conditionsText && (
          <div className="conditions-section" style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px'
          }}>
            <h3 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              color: colors.primary
            }}>
              Condiciones y Garantías
            </h3>
            <div style={{
              fontSize: '12px',
              lineHeight: '1.6',
              color: colors.textMuted,
              whiteSpace: 'pre-line'
            }}>
              {options.conditionsText}
            </div>
          </div>
        )}

        {options.includeSignature && (
          <QuoteSignature showDate={true} />
        )}

        <div className="quote-footer" style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid ' + colors.border,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          fontSize: '12px',
          color: colors.textMuted,
          gap: '40px'
        }}>
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <img src={qrCodeUrl} alt="QR" style={{ width: '70px', height: '70px' }} />
              <p style={{ margin: 0, fontSize: '11px' }}>Escanea para cargar</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </a>
              )}
              {facebookLink && (
                <a href={facebookLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Facebook size={16} />
                  <span>Facebook</span>
                </a>
              )}
              {tiktokLink && (
                <a href={tiktokLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Instagram size={16} />
                  <span>TikTok</span>
                </a>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '11px' }}>
              {settings?.phone && <span style={{ display: 'block' }}>Tel: {settings.phone}</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'corporate') {
    return (
      <div className="quote-document" style={{
        fontFamily: 'Arial, sans-serif',
        padding: '30px',
        margin: '0',
        color: colors.text,
        backgroundColor: colors.background,
        position: 'relative',
        minHeight: 'auto',
      }}>
        {options.showWatermark && settings?.logoUrl && (
          <QuoteWatermark logoUrl={settings.logoUrl} />
        )}

        <div className="quote-header" style={{
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: `2px solid ${colors.primary}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '22px',
                fontWeight: 'bold',
                margin: '0 0 6px 0',
                color: colors.primary,
              }}>
                {settings?.name.toUpperCase()}
              </h1>
              <p style={{ fontSize: '11px', margin: '3px 0', color: colors.textMuted }}>
                {settings?.taxId || settings?.nitId}
              </p>
              <p style={{ fontSize: '11px', margin: '3px 0', color: colors.textMuted }}>
                {settings?.phone}
              </p>
              <p style={{ fontSize: '11px', margin: '3px 0', color: colors.textMuted }}>
                {settings?.address}
              </p>
            </div>
          </div>
        </div>

        <div className="quote-title" style={{
          marginBottom: '18px',
          padding: '10px',
          backgroundColor: colors.primary,
          borderRadius: '2px'
        }}>
          <h2 style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            COTIZACIÓN #{saleId}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '18px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', margin: '0 0 3px 0', color: colors.textMuted }}>
              <strong>Fecha:</strong> {new Date().toLocaleDateString()}
            </p>
            <p style={{ fontSize: '11px', margin: '0', color: colors.textMuted }}>
              <strong>Válido por:</strong> {options.validDays} días
            </p>
          </div>
        </div>

        {customer && (
          <div className="customer-section" style={{
            marginBottom: '18px',
            padding: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '2px',
            backgroundColor: colors.background + '40'
          }}>
            <h3 style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '13px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              DATOS DEL CLIENTE
            </h3>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <p style={{ margin: '2px 0' }}><strong>Nombre:</strong> {customer.name}</p>
              {(customer as any).rif_nit && <p style={{ margin: '2px 0' }}><strong>RIF:</strong> {(customer as any).rif_nit}</p>}
              {customer.phone && <p style={{ margin: '2px 0' }}><strong>Teléfono:</strong> {customer.phone}</p>}
              {(customer as any).address && <p style={{ margin: '2px 0' }}><strong>Dirección:</strong> {(customer as any).address}</p>}
            </div>
          </div>
        )}

        <div className="products-section" style={{ marginBottom: '18px' }}>
          <h3 style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            DETALLE DE PRODUCTOS
          </h3>

          <div style={{
            border: `1px solid ${colors.border}`,
            borderRadius: '2px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '30px 2fr 1fr 80px',
              padding: '8px 12px',
              backgroundColor: colors.primary + '20',
              borderBottom: `1px solid ${colors.border}`,
              fontSize: '11px',
              fontWeight: 'bold',
              color: colors.primary,
              textTransform: 'uppercase'
            }}>
              <span style={{ textAlign: 'center' }}>#</span>
              <span>Descripción</span>
              <span style={{ textAlign: 'center' }}>Cant.</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>

            {cartItems.map((item, index) => (
              <div key={item.product.id} style={{
                display: 'grid',
                gridTemplateColumns: '30px 2fr 1fr 80px',
                padding: '10px 12px',
                borderBottom: `1px solid ${colors.border}`,
                fontSize: '12px',
                backgroundColor: index % 2 === 0 ? colors.background : colors.background + '50'
              }}>
                <span style={{ textAlign: 'center', color: colors.textMuted }}>{index + 1}</span>
                <div>
                  <p style={{ margin: '0 0 3px 0', fontWeight: '500' }}>{item.product.name}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: colors.textMuted }}>
                    {item.quantity} x {settings?.primaryCurrencySymbol}{item.price.toFixed(2)}
                  </p>
                </div>
                <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ textAlign: 'right', fontWeight: '600' }}>
                  {settings?.primaryCurrencySymbol}{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="totals-section" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '18px'
        }}>
          <div style={{ width: '300px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: `1px dashed ${colors.border}`,
              fontSize: '12px'
            }}>
              <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'}):</span>
              <span>{settings?.primaryCurrencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {settings?.tax1 && tax1Amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: `1px dashed ${colors.border}`,
                fontSize: '12px'
              }}>
                <span>Impuesto ({settings.tax1}%):</span>
                <span>{settings?.primaryCurrencySymbol}{tax1Amount.toFixed(2)}</span>
              </div>
            )}
            {settings?.tax2 && tax2Amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: `1px dashed ${colors.border}`,
                fontSize: '12px'
              }}>
                <span>Impuesto ({settings.tax2}%):</span>
                <span>{settings?.primaryCurrencySymbol}{tax2Amount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              marginTop: '8px',
              borderTop: '3px solid ' + colors.primary,
              fontSize: '16px',
              fontWeight: 'bold',
              color: colors.primary
            }}>
              <span>TOTAL:</span>
              <span>{settings?.primaryCurrencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {options.conditionsText && (
          <div className="conditions-section" style={{
            marginBottom: '18px',
            padding: '12px',
            backgroundColor: colors.background + '60',
            border: `1px solid ${colors.border}`,
            borderRadius: '2px'
          }}>
            <h3 style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '13px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              CONDICIONES Y GARANTÍAS
            </h3>
            <div style={{
              fontSize: '11px',
              lineHeight: '1.5',
              color: colors.textMuted,
              whiteSpace: 'pre-line'
            }}>
              {options.conditionsText}
            </div>
          </div>
        )}

        {options.includeSignature && (
          <QuoteSignature showDate={true} />
        )}

        <div className="quote-footer" style={{
          marginTop: '25px',
          paddingTop: '15px',
          borderTop: `2px solid ${colors.primary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          fontSize: '11px',
          color: colors.textMuted,
          gap: '30px'
        }}>
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <img src={qrCodeUrl} alt="QR" style={{ width: '65px', height: '65px' }} />
              <p style={{ margin: 0, fontSize: '10px' }}>Escanea para cargar</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MessageCircle size={14} />
                  <span style={{ fontWeight: '500' }}>WhatsApp</span>
                </a>
              )}
              {facebookLink && (
                <a href={facebookLink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Facebook size={14} />
                  <span style={{ fontWeight: '500' }}>Facebook</span>
                </a>
              )}
              {tiktokLink && (
                <a href={tiktokLink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Instagram size={14} />
                  <span style={{ fontWeight: '500' }}>TikTok</span>
                </a>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '10px' }}>
              {settings?.phone && <span style={{ display: 'block' }}>Tel: {settings.phone}</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'vibrant') {
    return (
      <div className="quote-document" style={{
        fontFamily: 'Arial, sans-serif',
        padding: '30px',
        margin: '0',
        color: colors.text,
        backgroundColor: colors.background,
        position: 'relative',
        minHeight: 'auto',
      }}>
        {options.showWatermark && settings?.logoUrl && (
          <QuoteWatermark logoUrl={settings.logoUrl} />
        )}

        <div className="quote-header" style={{
          marginBottom: '20px',
          padding: '15px',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
          borderRadius: '8px',
          color: 'white'
        }}>
          <h1 style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fontWeight: '800',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textAlign: 'center'
          }}>
            {settings?.name}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '11px', textAlign: 'center' }}>
            {settings?.taxId || settings?.nitId && (
              <span>📋 {settings.taxId || settings.nitId}</span>
            )}
            {settings?.phone && (
              <span>📞 {settings.phone}</span>
            )}
          </div>
        </div>

        <div className="quote-title" style={{
          marginBottom: '18px',
          padding: '12px',
          backgroundColor: colors.accent,
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontWeight: '800',
            margin: 0,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <FileText size={20} />
            COTIZACIÓN #{saleId}
          </h2>
          <p style={{ fontSize: '12px', margin: '6px 0 0 0', color: 'white', textAlign: 'center' }}>
            📅 {new Date().toLocaleDateString()} | ⏰ Válido por: {options.validDays} días
          </p>
        </div>

        {customer && (
          <div className="customer-section" style={{
            marginBottom: '18px',
            padding: '14px',
            border: `2px solid ${colors.accent}`,
            borderRadius: '8px',
            backgroundColor: colors.accent + '10'
          }}>
            <h3 style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Building2 size={16} />
              CLIENTE
            </h3>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <p style={{ margin: '3px 0' }}><strong>👤 Nombre:</strong> {customer.name}</p>
              {(customer as any).rif_nit && <p style={{ margin: '3px 0' }}><strong>🆔 RIF:</strong> {(customer as any).rif_nit}</p>}
              {customer.phone && <p style={{ margin: '3px 0' }}><strong>📱 Teléfono:</strong> {customer.phone}</p>}
              {(customer as any).address && <p style={{ margin: '3px 0' }}><strong>📍 Dirección:</strong> {(customer as any).address}</p>}
            </div>
          </div>
        )}

        <div className="products-section" style={{ marginBottom: '18px' }}>
          <h3 style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShoppingBag size={16} />
            DETALLE DE PRODUCTOS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cartItems.map((item, index) => (
              <div key={item.product.id} style={{
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                backgroundColor: colors.background,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13px',
                      margin: '0 0 4px 0',
                      fontWeight: '600',
                      color: colors.primary
                    }}>
                      {item.product.name}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      margin: 0,
                      color: colors.textMuted
                    }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 6px',
                        backgroundColor: colors.accent + '30',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        {item.quantity} x {settings?.primaryCurrencySymbol}{item.price.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div style={{ 
                    textAlign: 'right', 
                    fontWeight: '800', 
                    fontSize: '15px',
                    color: colors.primary,
                    minWidth: '80px'
                  }}>
                    {settings?.primaryCurrencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="totals-section" style={{
          marginBottom: '18px'
        }}>
          <div style={{
            padding: '15px',
            border: `2px solid ${colors.primary}`,
            borderRadius: '8px',
            backgroundColor: colors.primary + '10',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '12px',
              color: colors.textMuted
            }}>
              <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'}):</span>
              <span>{settings?.primaryCurrencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {settings?.tax1 && tax1Amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px',
                color: colors.textMuted
              }}>
                <span>Impuesto ({settings.tax1}%):</span>
                <span>{settings?.primaryCurrencySymbol}{tax1Amount.toFixed(2)}</span>
              </div>
            )}
            {settings?.tax2 && tax2Amount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px',
                color: colors.textMuted
              }}>
                <span>Impuesto ({settings.tax2}%):</span>
                <span>{settings?.primaryCurrencySymbol}{tax2Amount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: `2px solid ${colors.accent}`,
              fontSize: '18px',
              fontWeight: '800',
              color: colors.primary,
              letterSpacing: '1px'
            }}>
              <span>TOTAL:</span>
              <span>{settings?.primaryCurrencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {options.conditionsText && (
          <div className="conditions-section" style={{
            marginBottom: '18px',
            padding: '14px',
            backgroundColor: colors.accent + '10',
            border: `2px solid ${colors.accent}`,
            borderRadius: '8px'
          }}>
            <h3 style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Award size={16} />
              CONDICIONES Y GARANTÍAS
            </h3>
            <div style={{
              fontSize: '11px',
              lineHeight: '1.6',
              color: colors.textMuted,
              whiteSpace: 'pre-line'
            }}>
              {options.conditionsText}
            </div>
          </div>
        )}

        {options.includeSignature && (
          <QuoteSignature showDate={true} />
        )}

        <div className="quote-footer" style={{
          marginTop: '25px',
          paddingTop: '15px',
          borderTop: `2px solid ${colors.accent}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          fontSize: '11px',
          color: colors.textMuted,
          gap: '30px'
        }}>
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ padding: '8px', backgroundColor: colors.accent + '20', borderRadius: '8px' }}>
                <img src={qrCodeUrl} alt="QR" style={{ width: '65px', height: '65px' }} />
              </div>
              <p style={{ margin: 0, fontSize: '10px' }}>📱 Escanea para cargar</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </a>
              )}
              {facebookLink && (
                <a href={facebookLink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                  <Facebook size={16} />
                  <span>Facebook</span>
                </a>
              )}
              {tiktokLink && (
                <a href={tiktokLink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                  <Instagram size={16} />
                  <span>TikTok</span>
                </a>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '10px' }}>
              {settings?.phone && <span style={{ display: 'block' }}>📞 Tel: {settings.phone}</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
