import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Project } from '../src/project/project.entity';
import { AppModule } from './../src/app.module';

// Test helpers
const doLogin = (appServer, request) => {
  // the signing secret arg here is copied from the test.env file
  // this should be dealt with in a different way...
  const mockJWT = jwt.sign({
    mail: 'rsinger@planning.nyc.gov',
    exp: 1565932329 * 100,
  }, 'test');

  return request(appServer)
    .get(`/login?accessToken=${mockJWT}`)
}

const extractJWT = (response): string => {
  try { 
    // seems like the actual cookie is always the second in the array
    const { header: { 'set-cookie': [, token] } } = response;

    return token;
  } catch (e) {
    console.log(e);

    throw new Error(`Could not destructure. Is the server response working?`);
  }
}

describe('AppController (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('runs', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  describe('Logging in', () => {
    it('runs /login without token and gives an error', () => {
      return request(app.getHttpServer())
        .get('/login')
        .expect(401);
    });

    it('runs /login with accessToken and provides a new token', () => {
      return doLogin(app.getHttpServer(), request)
        .expect(200)
        .expect({ message: 'Login successful!' });
    });
  });

  describe('Users resource', () => {
    it('/users is authenticated', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('gets a user record when authenticated', async () => {
      const server = app.getHttpServer();
      const token = extractJWT(await doLogin(server, request));

      return request(server)
        .get('/users')
        .set('Cookie', token)
        .expect(200);
    });
  });

  describe('Projects', () => {
    describe('Filtering and searching', () => {
    });

    describe('Map tiles', () => {
    });

    describe('Details /:id', () => {
      test.todo('sideloads related actions, milestones, dispos')
    });

    describe('Geometry updates', () => {
      test.todo('should respond with failure if id does not meet regex requirements');
      test.todo('should respond failure message if project does not have BBLs');
      test.todo('should respond success message if project is updated');
    });

    describe('Downloads', () => {
      test.todo('responds to requests for shapefile');
      test.todo('responds to requests for csv');
      test.todo('responds to requests for geojson');
      test.todo('handles zero record queries for csvs');
    });
  });

  describe('LUPP Dashboard — User assignments', () => {
    test('prevents unauthorized access to /assignments', async () => {
      return request(app.getHttpServer())
        .get('/assignments')
        .expect(401);
    });

    test('allows for a "tab" query param', async () => {
      const server = app.getHttpServer();
      const token = extractJWT(await doLogin(server, request));

      return request(server)
        .get('/assignments?include=project.milestones%2Cproject.dispositions%2Cproject.actions&tab=to-review')
        .set('Cookie', token)
        .expect(200);
    });
  });

  describe('Document Upload', () => {

    // If this fails, it may be due to the project entity setup being changed in UAT2.
    // For example, if the project entity 2020K0121 is deleted, since this test uploads to that 
    // project entity. This test overwrites the file test.txt
    test('User can upload a single document to a Project 2020K0121', async () => {
      const server = app.getHttpServer();
      const token = extractJWT(await doLogin(server, request));

      // mock a file that says "buffer"
      const file = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);

      return request(server)
        .post('/document')
        .type('form')
        .attach('file', file, 'test.txt')
        .field('instanceName', '2020K0121')
        .field('entityName', 'dcp_project')
        .set('Cookie', token)
        .expect(200)
        .expect({ message: 'Uploaded document successfully.' });
    });

    // If this fails, it may be due to the disposition entity setup being changed in UAT2.
    // For example, if the disposition entity '2020K0121 - ZC - BK CB3  ' is deleted, since this test uploads to that 
    // project entity. This test overwrites the file test.txt
    test('User can upload a single document to a Disposition `2020K0121 - ZC - BK CB3  `', async () => {
      const server = app.getHttpServer();
      const token = extractJWT(await doLogin(server, request));

      // mock a file that says "buffer"
      const file = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);

      return request(server)
        .post('/document')
        .type('form')
        .attach('file', file, 'test.txt')
        .field('instanceName', '2020K0121 - ZC - BK CB3  ') // trailing spaces required
        .field('entityName', 'dcp_communityboarddisposition')
        .set('Cookie', token)
        .expect(200)
        .expect({ message: 'Uploaded document successfully.' });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
