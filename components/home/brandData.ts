
import placeholderImageData from '@/app/lib/placeholder-images.json';

export interface CubeBrand {
    id: number;
    brand: string;
    format: string;
    logoUrl: string;
    logoHint: string;
    description: string;
}

const brandDetails = [
    { brand: 'Amazon', format: 'Mixed', description: 'A mix of questions from all formats of cricket.' },
    { brand: 'Mastercard', format: 'IPL', description: 'Test your knowledge on the Indian Premier League.' },
    { brand: 'Netflix', format: 'T20', description: 'Fast-paced questions on T20 cricket.' },
    { brand: 'ICICI', format: 'ODI', description: 'Challenge yourself with One Day International facts.' },
    { brand: 'Gucci', format: 'WPL', description: 'Questions about the Women\'s Premier League.' },
    { brand: 'Nike', format: 'Test', description: 'Put your classic cricket knowledge to the test.' },
];

export const brandData: CubeBrand[] = brandDetails.map((detail, index) => {
    const imageData = placeholderImageData.brandLogos[index] || { src: '/images/placeholders/brand1.png', hint: 'logo' };
    return {
        id: index + 1,
        ...detail,
        logoUrl: imageData.src,
        logoHint: imageData.hint
    };
});
