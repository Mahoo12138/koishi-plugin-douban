"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRenderData = exports.URL_CONTENT_MOVIE = exports.URL_CONTENT_MUSIC = exports.URL_CONTENT_BOOK = exports.URL_SEARCH_MOVIE = exports.URL_SEARCH_MUSIC = exports.URL_SEARCH_BOOK = exports.headers = void 0;
const cheerio = __importStar(require("cheerio"));
exports.headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "Connection": "keep-alive",
    "sec-ch-ua": "\"Chromium\";v=\"94\", \"Microsoft Edge\";v=\"94\", \";Not A Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 Edg/94.0.992.50',
};
const URL_SEARCH = (path) => `https://search.douban.com/${path}/subject_search?search_text=`;
const URL_CONTENT = (category) => `https://${category}.douban.com/subject/`;
exports.URL_SEARCH_BOOK = URL_SEARCH('book');
exports.URL_SEARCH_MUSIC = URL_SEARCH('music');
exports.URL_SEARCH_MOVIE = URL_SEARCH('movie');
exports.URL_CONTENT_BOOK = URL_CONTENT('book');
exports.URL_CONTENT_MUSIC = URL_CONTENT('music');
exports.URL_CONTENT_MOVIE = URL_CONTENT('movie');
const parseRenderData = (html) => {
    const $ = cheerio.load(html);
    const card = $(".subjectwrap");
    const base = card.find("#info").text().split('\n').map(item => item.trim());
    const rating = card.find(".rating_per").map(function (i, el) {
        return $(this).text();
    }).get().map(p => p.replace('%', ''));
    for (let i = base.length - 1; i >= 0; i--) {
        if (base[i].length == 0) {
            base.splice(i, 1);
        }
    }
    return {
        base,
        rating,
    };
};
exports.parseRenderData = parseRenderData;
