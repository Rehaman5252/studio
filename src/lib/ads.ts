
export interface Ad {
    type: 'image' | 'video';
    url: string;
    title: string;
    duration: number;
    skippableAfter: number;
    hint?: string; // for image data-ai-hint
}

export const adLibrary: {
    hintAds: Ad[];
    midQuizAd: Ad;
    resultsAd: Ad;
} = {
    hintAds: [
        // Question 1 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by KFC', hint: 'food chicken', duration: 7, skippableAfter: 5 },
        // Question 2 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by Ceat Tyres', hint: 'tyres car', duration: 7, skippableAfter: 5 },
        // Question 3 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by MESA School', hint: 'education school', duration: 7, skippableAfter: 5 },
        // Question 4 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by Swiggy', hint: 'food delivery', duration: 7, skippableAfter: 5 },
        // Question 5 Hint
        { type: 'image', url: 'https://placehold.co/400x225.png', title: 'Hint by HDFC Bank', hint: 'finance bank', duration: 7, skippableAfter: 5 },
    ],
    midQuizAd: {
        type: 'video',
        // Royalty-free video from Pexels
        url: 'https://videos.pexels.com/video-files/8560088/8560088-hd_1366_720_30fps.mp4',
        title: 'Strategic Timeout',
        duration: 20,
        skippableAfter: 10,
    },
    resultsAd: {
        type: 'video',
        // Royalty-free video from Pexels
        url: 'https://videos.pexels.com/video-files/5993356/5993356-hd_1920_1080_25fps.mp4',
        title: 'Answers sponsored by: Indigo Airlines',
        duration: 30,
        skippableAfter: 15,
    }
};
