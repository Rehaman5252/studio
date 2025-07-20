
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
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        logoWidth: 100,
        logoHeight: 30,
    },
    {
        id: 2,
        brand: 'Mastercard',
        format: 'IPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg',
        logoWidth: 80,
        logoHeight: 80,
    },
    {
        id: 3,
        brand: 'Netflix',
        format: 'T20',
        logoUrl: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/netflix_logo_icon_170919.png',
        logoWidth: 80,
        logoHeight: 80,
    },
    {
        id: 4,
        brand: 'ICICI',
        format: 'ODI',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/2560px-ICICI_Bank_Logo.svg.png',
        logoWidth: 90,
        logoHeight: 30,
    },
     {
        id: 5,
        brand: 'Gucci',
        format: 'WPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Gucci_logo.svg',
        logoWidth: 100,
        logoHeight: 30,
    },
    {
        id: 6,
        brand: 'Nike',
        format: 'Test',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
        logoWidth: 100,
        logoHeight: 40,
    },
];
