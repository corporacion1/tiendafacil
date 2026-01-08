"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { QuoteTemplate, IndustryType, QuotePrintOptions, QuoteAIDialogProps } from '../quote-generator/types';
import { QuoteTemplates } from '../quote-generator/quote-templates';
import { loadQuotePreferences, saveQuotePreferences, loadIndustryConditions, saveIndustryConditions, INDUSTRY_TEMPLATES, DEFAULT_QUOTE_OPTIONS } from '../quote-generator/quote-storage';
import { generateQuotePDF, downloadQuotePDF } from '../quote-generator/quote-pdf-generator';
import QRCode from 'qrcode';
import { Plus, Minus } from 'lucide-react';

export function QuoteAIDialog({ isOpen, onOpenChange, cartItems, customer, saleId, settings }: QuoteAIDialogProps) {
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate>('minimalist');
  const [validDays, setValidDays] = useState(3);
  const [conditionsText, setConditionsText] = useState('');
  const [industryType, setIndustryType] = useState<IndustryType>('general');
  const [showWatermark, setShowWatermark] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.8);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const prefs = loadQuotePreferences();
      setSelectedTemplate(prefs.template);
      setValidDays(prefs.validDays);
      setIndustryType(prefs.industryType);
      setShowWatermark(prefs.showWatermark);
      setIncludeSignature(prefs.includeSignature);

      const savedConditions = loadIndustryConditions(prefs.industryType);
      setConditionsText(savedConditions);
    }
  }, [isOpen]);

  useEffect(() => {
    const generateQR = async () => {
      if (saleId && isOpen) {
        try {
          const qrUrl = await QRCode.toDataURL(saleId, {
            width: 100,
            margin: 1,
            errorCorrectionLevel: 'L'
          });
          setQrCodeUrl(qrUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      } else {
        setQrCodeUrl(null);
      }
    };
    generateQR();
  }, [saleId, isOpen]);

  const handlePresetClick = (industry: IndustryType) => {
    setIndustryType(industry);
    const industryConditions = loadIndustryConditions(industry);
    setConditionsText(industryConditions);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  let tax1Amount = 0;
  let tax2Amount = 0;

  cartItems.forEach(item => {
    if (item.product.tax1 && settings && settings.tax1 && settings.tax1 > 0) {
      tax1Amount += item.price * item.quantity * (settings.tax1 / 100);
    }
    if (item.product.tax2 && settings && settings.tax2 && settings.tax2 > 0) {
      tax2Amount += item.price * item.quantity * (settings.tax2 / 100);
    }
  });

  const total = subtotal + tax1Amount + tax2Amount;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.2));
  };

  const handlePrint = async () => {
    const element = previewRef.current;
    if (!element) return;

    try {
      setIsGenerating(true);

      const options: QuotePrintOptions = {
        template: selectedTemplate,
        validDays,
        conditionsText: conditionsText,
        industryType,
        showWatermark,
        includeSignature
      };

      saveQuotePreferences(options);
      saveIndustryConditions(industryType, conditionsText);

      await generateQuotePDF({
        element,
        settings,
        cartItems,
        customer,
        saleId,
        options
      });

      toast({
        title: '✅ Cotización generada',
        description: 'La cotización se ha generado correctamente.'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error generating quote PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar la cotización.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = previewRef.current;
    if (!element) return;

    try {
      setIsGenerating(true);

      const options: QuotePrintOptions = {
        template: selectedTemplate,
        validDays,
        conditionsText: conditionsText,
        industryType,
        showWatermark,
        includeSignature
      };

      saveQuotePreferences(options);
      saveIndustryConditions(industryType, conditionsText);

      await downloadQuotePDF({
        element,
        settings,
        cartItems,
        customer,
        saleId,
        options
      });

      toast({
        title: '✅ PDF descargado',
        description: 'El PDF se ha descargado correctamente.'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo descargar el PDF.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const templates = [
    { id: 'corporate' as QuoteTemplate, name: 'Corporativa', description: 'Profesional y equilibrado' },
    { id: 'minimalist' as QuoteTemplate, name: 'Minimalista', description: 'Limpio y elegante' },
    { id: 'vibrant' as QuoteTemplate, name: 'Vibrante', description: 'Moderno y colorido' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <DialogHeader>
          <DialogTitle>✨ Mejorar Cotización con IA</DialogTitle>
          <DialogDescription>
            Configura y genera una cotización profesional en formato carta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Selecciona una Plantilla</label>
            <div className="grid grid-cols-3 gap-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedTemplate === template.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {selectedTemplate === template.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="font-semibold">{template.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Vigencia de la Cotización (días)</label>
              <Input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 3)}
                min={1}
                max={365}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Industria</label>
              <Select value={industryType} onValueChange={(value: IndustryType) => setIndustryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Servicios</SelectItem>
                  <SelectItem value="technology">Tecnología</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Condiciones y Garantías</label>

            <Textarea
              value={conditionsText}
              onChange={(e) => {
                setConditionsText(e.target.value);
              }}
              placeholder="Ingresa las condiciones de venta y garantías..."
              rows={6}
            />

            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Plantillas rápidas:</span>
              {Object.keys(INDUSTRY_TEMPLATES).map(ind => (
                <button
                  key={ind}
                  onClick={() => handlePresetClick(ind as IndustryType)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    industryType === ind
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="watermark"
                checked={showWatermark}
                onCheckedChange={setShowWatermark}
              />
              <label htmlFor="watermark" className="text-sm">Mostrar marca de agua del logo</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="signature"
                checked={includeSignature}
                onCheckedChange={setIncludeSignature}
              />
              <label htmlFor="signature" className="text-sm">Incluir espacio para firma física</label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Vista Previa en Tiempo Real</label>

            <div className="border rounded-lg overflow-hidden bg-white" style={{
              maxHeight: '700px',
              overflow: 'hidden'
            }}>
              <div className="preview-header p-2 border-b bg-muted text-xs text-center text-muted-foreground flex items-center justify-between">
                <span>Vista Previa - {selectedTemplate === 'minimalist' ? 'Minimalista' : selectedTemplate === 'corporate' ? 'Corporativa' : 'Vibrante'}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="h-6 w-6 p-0"
                    title="Reducir zoom"
                  >
                    −
                  </Button>
                  <span className="text-xs w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="h-6 w-6 p-0"
                    title="Aumentar zoom"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div
                style={{
                  maxHeight: '640px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  target.style.setProperty('--scroll-position', target.scrollTop.toString());
                }}
              >
                <div
                  ref={previewRef}
                  className="origin-top flex justify-center py-8"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center'
                  }}
                >
                  {settings && (
                    <QuoteTemplates
                      template={selectedTemplate}
                      settings={settings as any}
                      cartItems={cartItems}
                      customer={customer}
                      saleId={saleId}
                      options={{
                        template: selectedTemplate,
                        validDays,
                        conditionsText: conditionsText,
                        industryType,
                        showWatermark,
                        includeSignature
                      }}
                      subtotal={subtotal}
                      totalItems={totalItems}
                      tax1Amount={tax1Amount}
                      tax2Amount={tax2Amount}
                      total={total}
                      qrCodeUrl={qrCodeUrl}
                    />
                  )}
                </div>
              </div>

              <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="default" onClick={handleDownloadPDF} disabled={isGenerating}>
            {isGenerating ? (
              <span className="inline-flex items-center gap-2">
                Descargando...
              </span>
            ) : (
              'Descargar PDF'
            )}
          </Button>
          <Button type="button" onClick={handlePrint} disabled={isGenerating}>
            {isGenerating ? (
              <span className="inline-flex items-center gap-2">
                Imprimiendo...
              </span>
            ) : (
              'Imprimir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
