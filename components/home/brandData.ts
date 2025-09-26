
import { getRandomImage } from "@/app/lib/getRandomImage";

export interface CubeBrand {
    id: number;
    brand: string;
    format: string;
    logoUrl: string;
    logoHint: string;
    description: string;
}

const brandDetails = [
    { id: 1, brand: 'Amazon', format: 'Mixed', description: 'A mix of questions from all formats of cricket.' },
    { id: 2, brand: 'Mastercard', format: 'IPL', description: 'Test your knowledge on the Indian Premier League.' },
    { id: 3, brand: 'Netflix', format: 'T20', description: 'Fast-paced questions on T20 cricket.' },
    { id: 4, brand: 'ICICI', format: 'ODI', description: 'Challenge yourself with One Day International facts.' },
    { id: 5, brand: 'Gucci', format: 'WPL', description: "Questions about the Women's Premier League." },
    { id: 6, brand: 'Nike', format: 'Test', description: 'Put your classic cricket knowledge to the test.' },
];

export const brandData: CubeBrand[] = brandDetails.map((detail) => {
    const logoData = {
        'Amazon': { src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", hint: 'Amazon logo' },
        'Mastercard': { src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg", hint: 'Mastercard logo' },
        'Netflix': { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Netflix_2015_N_logo.svg/1200px-Netflix_2015_N_logo.svg.png", hint: 'Netflix logo' },
        'ICICI': { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/1280px-ICICI_Bank_Logo.svg.png", hint: 'ICICI logo' },
        'Gucci': { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gucci_logo.svg/2560px-Gucci_logo.svg.png", hint: 'Gucci logo' },
        'Nike': { src: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg", hint: 'Nike logo' },
    };
    
    const logoInfo = logoData[detail.brand as keyof typeof logoData] || { src: '', hint: '' };

    return {
        ...detail,
        logoUrl: logoInfo.src,
        logoHint: logoInfo.hint,
    };
});
