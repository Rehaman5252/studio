
export interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  logoUrl: string; // Should be a white logo with transparent background for best results
  logoWidth?: number; // Optional, for legacy components
  logoHeight?: number; // Optional, for legacy components
  invertOnDark?: boolean; // Optional, for legacy components
}

export const brands: CubeBrand[] = [
    { id: 1, brand: 'Tata', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Tata_logo.svg/1024px-Tata_logo.svg.png' }, // Using a version that will look ok
    { id: 2, brand: 'ICICI Bank', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/1024px-ICICI_Bank_Logo.svg.png' },
    { id: 3, brand: 'Amazon', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Amazon-logo-white.svg/1024px-Amazon-logo-white.svg.png' },
    { id: 4, brand: 'PayPal', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png' },
    { id: 5, brand: 'Nike', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png' },
    { id: 6, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_white.svg/1024px-Apple_logo_white.svg.png' },
];
