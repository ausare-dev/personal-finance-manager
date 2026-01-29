/**
 * E2E env: set NODE_ENV=test.
 * DATABASE_NAME: use pfm_db_test for isolated E2E (create it first), or leave
 * unset to use .env default (e.g. pfm_db). See backend/TESTING.md.
 */
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
