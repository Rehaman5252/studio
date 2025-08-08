
export interface CubeBrand {
    id: number;
    brand: string;
    format: string;
    logoUrl: string;
    description: string;
}

export const brandData: CubeBrand[] = [
    {
        id: 1,
        brand: 'Amazon',
        format: 'Mixed',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        description: 'A mix of questions from all formats of cricket.'
    },
    {
        id: 2,
        brand: 'Mastercard',
        format: 'IPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg',
        description: 'Test your knowledge on the Indian Premier League.'
    },
    {
        id: 3,
        brand: 'Netflix',
        format: 'T20',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Netflix_2015_N_logo.svg/1200px-Netflix_2015_N_logo.svg.png',
        description: 'Fast-paced questions on T20 cricket.'
    },
    {
        id: 4,
        brand: 'ICICI',
        format: 'ODI',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg',
        description: 'Challenge yourself with One Day International facts.'
    },
     {
        id: 5,
        brand: 'Gucci',
        format: 'WPL',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Gucci_logo.svg',
        description: 'Questions about the Women\'s Premier League.'
    },
    {
        id: 6,
        brand: 'Nike',
        format: 'Test',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
        description: 'Put your classic cricket knowledge to the test.'
    },
];
