import * as jwt from 'jsonwebtoken';
import * as nock from 'nock';

export const doLogin = (appServer, request, {
  // these are "stable" test credentials in the CRM environment
  // if the CRM environment changes from uat2, this will need to be
  // recreated. This user should be a LUP with assigned projects.
  email = 'labs_dl@planning.nyc.gov',
  contactid = '56B08864-500D-EA11-A9A9-001DD83080AB',
} = {}) => {
  nock('https://dcppfsuat2.crm9.dynamics.com:443')
    .get(uri => uri.includes('api/data/v9.1/contacts'))
    .reply(200, {
      '@odata.context': '/$entity',
      value: [{
        contactid,
        emailaddress1: email,
      }],
    })
    .persist();

  // the signing secret arg here is copied from the test.env file
  // this should be dealt with in a different way...
  const mockJWT = jwt.sign({
    mail: email,
    exp: 1565932329 * 100,
  }, 'test');

  return request(appServer)
    .get(`/login?accessToken=${mockJWT}`)
};
