'use strict'

const tap = require('tap')
const Fastify = require('fastify')
const fastifyRedisSession = require('..')
const fastifyRedis = require('@fastify/redis')
const fastifyCookie = require('@fastify/cookie')

tap.test('Setting data', async (t) => {
  try {
    const fastify = Fastify({ logger: false })
    await fastify.register(fastifyCookie, {
      secret: 'my-secret',
      hook: 'onRequest',
      parseOptions: {}
    })
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
    const emptyResponse = await fastify.inject({ method: 'GET', url: '/' })
    t.equal(emptyResponse.statusCode, 200)
    t.same(emptyResponse.json(), {})
    const createResponse = await fastify
      .inject({
        method: 'POST',
        url: '/data'
      })
      .catch((e) => {
        console.error(e)
        t.fail()
      })
    t.equal(createResponse.statusCode, 200)
    t.equal(createResponse.body, 'ok')
    const getResponse = await fastify.inject({ method: 'GET', url: '/data' })
    t.equal(getResponse.statusCode, 200)
    t.equal(getResponse.body, 'jhone')
  } catch (e) {}
})
