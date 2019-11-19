import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import * as nock from 'nock';
import * as rootPath from 'app-root-path';
import * as fs from 'fs';
import { doLogin } from './helpers/do-login';
import { extractJWT } from './helpers/extract-jwt';
import { AppModule } from './../src/app.module';
import { Project } from './../src/project/project.entity';
import { strict as assert } from 'assert';

describe('Download Get', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // NOTE: this test is actually hitting the database. it maybe fail due to a timeout.
  // if this happens rerun the test. in the long-run, get a real test database!
  test('Get correct download keys', async () => {
    const server = app.getHttpServer(); // UAT2 server
    const token = extractJWT(await doLogin(server, request)); // token that is passed with each request

    return request(server)
      .get('/projects.csv?page=1&dcp_publicstatus%5B0%5D=Filed&dcp_publicstatus%5B1%5D=In%20Public%20Review')
      .set('Cookie', token)
      .expect(200)
      .then(async response => {
        console.log(response);


      });
  }, 30000);
});
