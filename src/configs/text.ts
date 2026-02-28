export enum MarkType {
    submitted = 0,
    editing = 1,
}

export enum MarkColor {
    submitted = "#3dd2b0",
    editing = "#99ccff"
}

export interface Mark{
    id: string,
    sequence: string,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    width: number,
    height: number,
    type: MarkType,
    articleId: string,
    pageIndex: number,
    color: MarkColor,
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