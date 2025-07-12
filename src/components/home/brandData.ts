
export interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  logoUrl: string;
  logoWidth?: number;
  logoHeight?: number;
  invertOnDark?: boolean;
}

export const brands: CubeBrand[] = [
    { id: 1, brand: 'Nike', format: 'WPL', logoUrl: '/logos/white/nike.svg', invertOnDark: true },
    { id: 2, brand: 'Apple', format: 'T20', logoUrl: '/logos/white/apple.svg', invertOnDark: true },
    { id: 3, brand: 'ICICI Bank', format: 'Mixed', logoUrl: '/logos/white/icici.svg', invertOnDark: true },
    { id: 4, brand: 'Gucci', format: 'Test', logoUrl: '/logos/white/gucci.svg', invertOnDark: true },
    { id: 5, brand: 'Amazon', format: 'IPL', logoUrl: '/logos/white/amazon.svg', invertOnDark: true },
    { id: 6, brand: 'Tata', format: 'ODI', logoUrl: '/logos/white/tata.svg', invertOnDark: true },
];
