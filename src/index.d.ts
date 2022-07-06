import { Context, Schema } from 'koishi';
export declare const name = "douban";
export declare const using: readonly ["puppeteer"];
interface TemplateOptions {
    simpleTemplate?: boolean;
}
export declare const Config: Schema<{
    simple?: boolean;
} & import("koishi").Dict<any, string>, {
    simple: boolean;
} & import("koishi").Dict<any, string>>;
export declare function apply(ctx: Context, config: TemplateOptions): void;
export {};
