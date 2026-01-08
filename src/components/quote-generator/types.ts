import type { Settings, CartItem, Customer } from '@/lib/types';

export type QuoteTemplate = 'corporate' | 'minimalist' | 'vibrant';

export type IndustryType = 'retail' | 'services' | 'technology' | 'general';

export interface QuotePrintOptions {
  template: QuoteTemplate;
  validDays: number;
  conditionsText: string;
  industryType: IndustryType;
  showWatermark: boolean;
  includeSignature: boolean;
}

export interface QuoteAIDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  customer: Customer | null;
  saleId: string;
  settings: Settings | null;
  onPrint: (options: QuotePrintOptions) => void;
}

export interface QuoteTemplateProps {
  template: QuoteTemplate;
  settings: Settings | null;
  cartItems: CartItem[];
  customer: Customer | null;
  saleId: string;
  options: QuotePrintOptions;
  subtotal: number;
  totalItems: number;
  tax1Amount: number;
  tax2Amount: number;
  total: number;
  qrCodeUrl: string | null;
}

export interface PaletteColors {
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  background: string;
  text: string;
  textMuted: string;
  border: string;
}
