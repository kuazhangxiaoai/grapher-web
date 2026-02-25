export enum GraphType {
    Text = 1,
    Database = 2,
    Free = 3,
}

export interface GraphConfig {
    name: string;
    topic: string;
    domain: string;
    description: string;
    graph_db: string;
    type: GraphType;
}