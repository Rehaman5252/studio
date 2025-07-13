
export interface CubeBrand {
    id: number;
    brand: string;
    format: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
}

export const brandData: CubeBrand[] = [
    {
        id: 1,
        brand: 'Amazon',
        format: 'Mixed',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png',
        logoWidth: 100,
        logoHeight: 30,
    },
    {
        id: 2,
        brand: 'TATA',
        format: 'IPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/TATA_logo.svg/2560px-TATA_logo.svg.png',
        logoWidth: 100,
        logoHeight: 40,
    },
    {
        id: 3,
        brand: 'Apple',
        format: 'T20',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/833px-Apple_logo_black.svg.png',
        logoWidth: 60,
        logoHeight: 70,
    },
    {
        id: 4,
        brand: 'ICICI',
        format: 'ODI',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/2560px-ICICI_Bank_Logo.svg.png',
        logoWidth: 80,
        logoHeight: 60,
    },
     {
        id: 5,
        brand: 'Gucci',
        format: 'WPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gucci_logo.svg/1200px-Gucci_logo.svg.png',
        logoWidth: 100,
        logoHeight: 30,
    },
    {
        id: 6,
        brand: 'Nike',
        format: 'Test',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png',
        logoWidth: 100,
        logoHeight: 40,
    },
];
