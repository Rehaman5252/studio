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
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Netflix_2015_N_logo.svg/1200px-Netflix_2015_N_logo.svg.png',
        logoWidth: 60,
        logoHeight: 60,
    },
    {
        id: 4,
        brand: 'ICICI',
        format: 'ODI',
        logoUrl: 'https://www.pngkey.com/png/full/50-503003_icici-bank-logo-png-icici-bank-logo.png',
        logoWidth: 80,
        logoHeight: 60,
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
        logoUrl: 'https://logolook.net/wp-content/uploads/2021/11/Nike-Logo.png',
        logoWidth: 100,
        logoHeight: 40,
    },
];
