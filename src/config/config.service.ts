import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: { [key: string]: string } = {};

  constructor(filePath: string) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
      this.envConfig = process.env;
    } else {
      this.envConfig = dotenv.parse(fs.readFileSync(filePath)) || {};
    }
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
