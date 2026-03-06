export enum GraphTypeText {
    Text = "text",
    Database = "database",
    Free = "any",
}

export enum GraphTypeInteger{
    Text = 0,
    Database = 1,
    Free = 2,
}

export interface NodeProperty {
    key?: string;
    type: string;
    value?: unknown;
}

export interface NodeTemplate {
    id: string;
    name: string;
    color: string;
}

export interface EdgeTemplate {
    id: string;
    name: string;
    from: string;
    to: string;
}

export interface EdgeProperty {
    key?: string;
    type?: string;
    value?: unknown;
}

export interface GraphConfig {
    id: string;
    name: string;
    articleUrl: string;
    articleName: string;
    topicId: string;
    topicName: string;
    domainId: string;
    domainName: string;
    createMethod: string;
    createdAt: string;
}