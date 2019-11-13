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

// class AssignMock {
//   update() {} // noop
// }

async function checkResponse(response) {
  const boop = await response.body.data[0];
  const boopProps = Object.keys(boop);
  console.log('boopProps', boopProps);
  if (!boopProps.includes('peach')) {
    console.log('it is erroringggg');
    throw new Error('There is no property peach');
  }
  // console.log('boop', ob
  // console.log('peaches', boop);
}

describe('Assignment Get', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      // .overrideProvider(getRepositoryToken(Project))
      // .useValue(new AssignMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeAll(() => {
    nock('https://login.microsoftonline.com:443')
      .post(uri => uri.includes('oauth2/token'))
      .reply(200, {
        token_type: 'Bearer',
        expires_in: '3600',
        ext_expires_in: '3600',
        expires_on: '1573159181',
        not_before: '1573155281',
        resource: 'https://dcppfsuat2.crm9.dynamics.com',
        access_token: 'test'
      })
      .persist();

    const scope = nock('https://dcppfsuat2.crm9.dynamics.com:443');

    scope
      .get(uri => uri.includes('api/data/v9.1/dcp_projects'))
      .reply(200, '1f8b08000000000004008c8fcd4ec33010845f255a38b452127b9d407e4e454085847a29070e1421cbde80511247b1538150df1d17155438711c6b3eef371fb0b05a7a992adb7b7af350c38bf783ab19d36a181a37492f52357655aadf7bd919e542b56372306ccfb16d95223bedc8cb7d3c09d0d330da5752decd8e4240293eca467fa5fdf31c6258ac8c1aadb38d4fafbecf5cae57a9b75eb623293b6a65a73ee825f8ff766b3a134629224d1aea46b68e62d8ca7622a81f7ea607f7e7b0fb9e6d0051f0e21cf37203c1ea8f7fe8206679b49c5a6ffbe8624bfd44d16cb9bebebb99ffae9b700e1acace50949464852c12aa101359954dc2396a5d66bce47971c00edf0b2ef82d4781b07bdc7d0e000e5597419b010000', {
        'Content-Encoding': 'gzip',
      })
      .persist();
  });

  test('Get correct assignment keys', async () => {
    const server = app.getHttpServer(); // UAT2 server
    const token = extractJWT(await doLogin(server, request)); // token that is passed with each request

    return request(server)
      .get('/assignments?include=project.milestones%2Cproject.dispositions%2Cproject.actions&tab=upcoming')
      .set('Cookie', token)
      .expect(200)
      .then(async response => {
        const firstData = await response.body.data[0];
        expect(firstData).toHaveProperty("id")
        expect(firstData).toHaveProperty("relationships")
        expect(firstData).toHaveProperty("type", "assignments")

        const attributes = await response.body.data[0].attributes;
        expect(attributes).toHaveProperty("actualenddate")
        expect(attributes).toHaveProperty("actualstartdate")
        expect(attributes).toHaveProperty("dcp-lupteammemberrole")
        expect(attributes).toHaveProperty("dcp-name")
        expect(attributes).toHaveProperty("dcp-projectbrief")
        expect(attributes).toHaveProperty("dcp-projectname")
        expect(attributes).toHaveProperty("dcp-publicstatus")
        expect(attributes).toHaveProperty("dcp-ulurp-nonulurp")
        expect(attributes).toHaveProperty("lup-name")

        expect(attributes).toHaveProperty("plannedcompletiondate")
        expect(attributes).toHaveProperty("plannedstartdate")
        expect(attributes).toHaveProperty("project-applicantteam")

        expect(attributes).toHaveProperty("project-id")
        expect(attributes).toHaveProperty("tab", "upcoming")
        expect(attributes).toHaveProperty("dcp-ulurp-nonulurp")
        expect(attributes).toHaveProperty("lup-name")
      });

  });
});
