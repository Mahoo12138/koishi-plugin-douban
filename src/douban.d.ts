export declare type SearchItem = {
    id: number;
    url: string;
    title: string;
    rating: {
        [key: string]: string | number;
    };
    abstract: string;
};
export declare const headers: {
    Accept: string;
    "Accept-Language": string;
    Connection: string;
    "sec-ch-ua": string;
    "sec-ch-ua-mobile": string;
    "Sec-Fetch-Dest": string;
    "Sec-Fetch-Mode": string;
    "Sec-Fetch-Site": string;
    "Sec-Fetch-User": string;
    "Upgrade-Insecure-Requests": string;
    "User-Agent": string;
};
export declare const URL_SEARCH_BOOK: string;
export declare const URL_SEARCH_MUSIC: string;
export declare const URL_SEARCH_MOVIE: string;
export declare const URL_CONTENT_BOOK: string;
export declare const URL_CONTENT_MUSIC: string;
export declare const URL_CONTENT_MOVIE: string;
export declare const parseRenderData: (html: string) => {
    base: string[];
    rating: string[];
};
