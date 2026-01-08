import type { QuotePrintOptions, IndustryType } from './types';

const QUOTE_PREFS_KEY = 'tienda_facil_quote_preferences';
const QUOTE_CONDITIONS_KEY = 'tienda_facil_quote_conditions';
const QUOTE_NOTES_KEY = 'tienda_facil_quote_notes';

export const DEFAULT_QUOTE_OPTIONS: QuotePrintOptions = {
  template: 'minimalist',
  validDays: 3,
  conditionsText: '',
  industryType: 'general',
  showWatermark: true,
  includeSignature: true,
};

export const INDUSTRY_TEMPLATES = {
  retail: `Garantía de 30 días en defectos de fábrica.
Devoluciones hasta 30 días con producto sin uso.
Precios sujetos a cambios sin previo aviso.`,

  services: `Incluye garantía por 1 año en mano de obra.
Materiales garantizados por fabricante.
Cambios requieren aprobación previa.
Precios pueden variar según complejidad del servicio.`,

  technology: `Garantía de 1 año en equipos y 6 meses en accesorios.
No cubre daños por mal uso o manipulación no autorizada.
Soporte técnico disponible 9am-6pm.
Precios sujetos a disponibilidad de stock.`,

  general: `Garantía de 30 días en defectos de fábrica.
Precios sujetos a cambios sin previo aviso.
Para confirmar tu pedido, contáctanos.`,
};

export function loadQuotePreferences(): QuotePrintOptions {
  if (typeof window === 'undefined') return DEFAULT_QUOTE_OPTIONS;

  try {
    const saved = localStorage.getItem(QUOTE_PREFS_KEY);
    return saved ? { ...DEFAULT_QUOTE_OPTIONS, ...JSON.parse(saved) } : DEFAULT_QUOTE_OPTIONS;
  } catch (e) {
    return DEFAULT_QUOTE_OPTIONS;
  }
}

export function saveQuotePreferences(prefs: QuotePrintOptions): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(QUOTE_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error saving quote preferences:', e);
  }
}

export function loadIndustryConditions(industry: IndustryType): string {
  if (typeof window === 'undefined') return INDUSTRY_TEMPLATES[industry];

  try {
    const saved = localStorage.getItem(QUOTE_CONDITIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[industry] || INDUSTRY_TEMPLATES[industry];
    }
  } catch (e) {
    console.error('Error loading industry conditions:', e);
  }

  return INDUSTRY_TEMPLATES[industry];
}

export function saveIndustryConditions(industry: IndustryType, text: string): void {
  if (typeof window === 'undefined') return;

  try {
    const saved = localStorage.getItem(QUOTE_CONDITIONS_KEY);
    const current = saved ? JSON.parse(saved) : {};
    current[industry] = text;
    localStorage.setItem(QUOTE_CONDITIONS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving industry conditions:', e);
  }
}
