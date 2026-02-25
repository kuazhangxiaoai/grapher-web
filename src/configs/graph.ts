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
    name: string;
    topic: string;
    domain: string;
    description: string;
    graph_db: string;
    type: GraphType;
}