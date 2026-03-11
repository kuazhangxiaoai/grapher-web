export enum MarkType {
    submitted = 0,
    editing = 1,
}

export enum MarkColor {
    submitted = "#3dd2b0",
    editing = "#99ccff"
}

export interface Rect{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    width: number;
    height: number;
    page: number
}

export interface Mark{
    id: string,
    content: string,
    rects: Rect[],
    type: MarkType,
    articleId: string,
    color: MarkColor,
    sequenceId?: string,
}

export interface Article {
    articleId: string
    articleName: string,
    articleTitle: string,
    articleUrl: string,
    topicId: string,
    topicName: string,
    domainId: string
    domainName: string
}