'use strict'

const tap = require('tap')
const Fastify = require('fastify')
const fastifyRedisSession = require('..')
const fastifyRedis = require('@fastify/redis')
const fp = require('fastify-plugin')
const { ulid } = require('ulid')

// Register a lightweight, test-only cookie plugin compatible with the Fastify version used in CI
async function fakeCookiePlugin (instance, opts) {
  // minimal decorations expected by the plugin under test
  instance.decorateRequest('cookies', {})
  instance.decorateReply('cookie', function (name, val, options) {
    // store cookies set during the request for assertions if needed
    this._setCookies = this._setCookies || {}
    this._setCookies[name] = { val, options }
  })
}

tap.test('Setting data', async (t) => {
  const fastify = Fastify({ logger: false })
  await fastify.register(fp(fakeCookiePlugin, { name: '@fastify/cookie' }))
  t.teardown(fastify.close.bind(fastify))
  await fastify.register(fastifyRedis, {
    url: 'redis://localhost'
  })
  await fastify.register(fastifyRedisSession, {})
  fastify.get('/', (req, res) => {
    req.session = {}
    res
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(req.session))
  })
  fastify.get('/data', (req, res) => {
    res.send(req.session.name)
  })
  fastify.post('/data', (req, res) => {
    req.session.name = 'jhone'
    res.code(200).send('ok')
  })
  const key = ulid()
  const emptyResponse = await fastify.inject({
    method: 'GET',
    url: '/',
    cookies: {
      session_redis: key
    }
  })
  t.equal(emptyResponse.statusCode, 200)
  t.same(emptyResponse.json(), {})
  const createResponse = await fastify
    .inject({
      method: 'POST',
      url: '/data',
      cookies: {
        session_redis: key
      }
    })
  t.equal(createResponse.statusCode, 200)
  t.equal(createResponse.body, 'ok')
  const getResponse = await fastify.inject({
    method: 'GET',
    url: '/data',
    cookies: {
      session_redis: key
    }
  })
  t.equal(getResponse.statusCode, 200)
  t.equal(getResponse.body, 'jhone')
})
