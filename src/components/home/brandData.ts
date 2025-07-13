
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
        brand: 'CricBlitz',
        format: 'Mixed',
        logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-transparent-png-images-icons-25.png',
        logoWidth: 80,
        logoHeight: 80,
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
        brand: 'ICC',
        format: 'T20',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/International_Cricket_Council_logo.svg/1200px-International_Cricket_Council_logo.svg.png',
        logoWidth: 60,
        logoHeight: 80,
    },
    {
        id: 4,
        brand: 'ACC',
        format: 'ODI',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Asian_Cricket_Council_logo.svg/1200px-Asian_Cricket_Council_logo.svg.png',
        logoWidth: 80,
        logoHeight: 80,
    },
     {
        id: 5,
        brand: 'TATA',
        format: 'WPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/TATA_logo.svg/2560px-TATA_logo.svg.png',
        logoWidth: 100,
        logoHeight: 40,
    },
    {
        id: 6,
        brand: 'ICC',
        format: 'Test',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/International_Cricket_Council_logo.svg/1200px-International_Cricket_Council_logo.svg.png',
        logoWidth: 60,
        logoHeight: 80,
    },
];
