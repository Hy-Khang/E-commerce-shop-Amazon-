import { DataSource } from 'typeorm';

export interface ISeed {
  name: string;
  order: number;
  tables: string[];
  run(dataSource: DataSource): Promise<void>;
}
