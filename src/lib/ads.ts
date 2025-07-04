
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
        { type: 'image', url: 'https://placehold.co/400x200.png', title: 'Hint by KFC', hint: 'food chicken', duration: 5, skippableAfter: 2 },
        // Question 2 Hint
        { type: 'image', url: 'https://placehold.co/400x200.png', title: 'Hint by Ceat Tyres', hint: 'tyres car', duration: 5, skippableAfter: 2 },
        // Question 3 Hint
        { type: 'image', url: 'https://placehold.co/400x200.png', title: 'Hint by MESA School', hint: 'education school', duration: 5, skippableAfter: 2 },
        // Question 4 Hint
        { type: 'image', url: 'https://placehold.co/400x200.png', title: 'Hint by Swiggy', hint: 'food delivery', duration: 5, skippableAfter: 2 },
        // Question 5 Hint
        { type: 'image', url: 'https://placehold.co/400x200.png', title: 'Hint by HDFC Bank', hint: 'finance bank', duration: 5, skippableAfter: 2 },
    ],
    midQuizAd: {
        type: 'video',
        // Using a generic car video as a placeholder for Toyota
        url: 'https://videos.pexels.com/video-files/8560088/8560088-hd_1366_720_30fps.mp4',
        title: 'A break from our sponsor: Toyota',
        duration: 10,
        skippableAfter: 5,
    },
    resultsAd: {
        type: 'video',
        // Using a generic airline video as a placeholder for Indigo
        url: 'https://videos.pexels.com/video-files/5993356/5993356-hd_1920_1080_25fps.mp4',
        title: 'Answers sponsored by: Indigo Airlines',
        duration: 30,
        skippableAfter: 15,
    }
};
