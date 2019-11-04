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
      // the signing secret arg here is copied from the test.env file
      // this should be dealt with in a different way...
      const mockJWT = jwt.sign({
        mail: 'rsinger@planning.nyc.gov',
        exp: 1565932329 * 100,
      }, 'test');

      return request(app.getHttpServer())
        .get(`/login?accessToken=${mockJWT}`)
        .expect(200)
        .expect({ message: 'Login successful!' });
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
      // it('accepts different filtering options', async () => {
      //   const appServer = app.getHttpServer();

      //   // primitive-type filters
      //   //  string
      //   await request(appServer)
      //     .get('/projects?project_applicant_text=test')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?block=test')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?project_lup_status=test')
      //     .expect(200);

      //   //  numeric
      //   await request(appServer)
      //     .get('/projects?itemsPerPage=1')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?radius_from_point=1')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?page=1')
      //     .expect(200);

      //   //  boolean
      //   await request(appServer)
      //     .get('/projects?dcp_femafloodzonev=false')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_femafloodzonecoastala=false')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_femafloodzonea=false')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_femafloodzoneshadedx=false')
      //     .expect(200);

      //   // // enumerable list filters
      //   //  string
      //   await request(appServer)
      //     .get('/projects?community-districts[]=""')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?action-types[]=""')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?boroughs[]=""')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_ceqrtype[]=""')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_ulurp_nonulurp[]=""')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_publicstatus[]=""')
      //     .expect(200);
      //   await request(appServer)
      //     .get('/projects?dcp_certifiedreferred[]=""')
      //     .expect(200);

      //   //  numeric
      //   return request(appServer)
      //     .get('/projects?distance_from_point[]=1')
      //     .expect(200);
      // });
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
    test.todo('prevents unauthorized access to /assignments');
    test.todo('allows for a "tab" query param');
  });

  afterAll(async () => {
    await app.close();
  });
});
