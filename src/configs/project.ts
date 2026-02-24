export enum ProjectType {
    Text2Graph = 1,
    DB2Graph = 2,
}

export interface ProjectConfig {
    name: string;
    topic: string;
    domain: string;
    description: string;
    graph_db: string;
    type: ProjectType;
}