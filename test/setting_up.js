const tap = require('tap')
const fastifyRedisSession = require('..')

tap.test('If @fastify/cookie not exists it must throw error', async (t) => {
  try {
    const fastify = {
      hasPlugin (name) {
        return name !== '@fastify/cookie'
      }
    }
    t.throws(
      () => fastifyRedisSession(fastify, {}, () => {}),
      new Error('@fastify/cookie plugin required')
    )
  } catch (e) {
    t.fail()
  }
})

tap.test('If @fastify/redis not exists it must throw error', async (t) => {
  try {
    const fastify = {
      hasPlugin (name) {
        return name !== '@fastify/redis'
      }
    }
    t.throws(
      () => fastifyRedisSession(fastify, {}, () => {}),
      new Error('@fastify/redis plugin required')
    )
  } catch (e) {
    t.fail()
  }
})

tap.test('If all of the required plugins exists, it must run', async (t) => {
  try {
    const fastify = {
      hasPlugin (name) {
        return true
      },
      addHook (...args) {
        return true
      },
      decorateRequest (...args) {
        return true
      }
    }
    fastifyRedisSession(fastify, {}, () => {})
  } catch (e) {
    t.fail()
  }
})
