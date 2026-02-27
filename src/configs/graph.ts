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