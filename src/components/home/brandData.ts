
export interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  logoUrl: string; // This will now be the COLOR logo for the banner
  whiteLogoUrl: string; // This is the new property for the cube
  logoWidth: number;
  logoHeight: number;
}

export const brands: CubeBrand[] = [
    { id: 1, brand: 'Amazon', format: 'Mixed', logoUrl: '/logos/color/amazon.svg', whiteLogoUrl: '/logos/white/amazon.svg', logoWidth: 100, logoHeight: 30 },
    { id: 2, brand: 'Tata', format: 'IPL', logoUrl: '/logos/color/tata.svg', whiteLogoUrl: '/logos/white/tata.svg', logoWidth: 80, logoHeight: 80 },
    { id: 3, brand: 'Nike', format: 'Test', logoUrl: '/logos/color/nike.svg', whiteLogoUrl: '/logos/white/nike.svg', logoWidth: 90, logoHeight: 40 },
    { id: 4, brand: 'Apple', format: 'T20', logoUrl: '/logos/color/apple.svg', whiteLogoUrl: '/logos/white/apple.svg', logoWidth: 50, logoHeight: 60 },
    { id: 5, brand: 'ICICI Bank', format: 'ODI', logoUrl: '/logos/color/icici.svg', whiteLogoUrl: '/logos/white/icici.svg', logoWidth: 90, logoHeight: 40 },
    { id: 6, brand: 'Gucci', format: 'WPL', logoUrl: '/logos/color/gucci.svg', whiteLogoUrl: '/logos/white/gucci.svg', logoWidth: 100, logoHeight: 25 },
];
