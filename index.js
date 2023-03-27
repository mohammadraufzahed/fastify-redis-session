const fastifyPlugin = require('fastify-plugin')
const { ulid } = require('ulid')

function fastifyRedisSession (fastify, options, next) {
  // Check the required plugins
  if (!fastify.hasPlugin('@fastify/cookie')) {
    throw new Error('@fastify/cookie plugin required')
  }
  if (!fastify.hasPlugin('@fastify/redis')) {
    throw new Error('@fastify/redis plugin required')
  }
  // Proxy Handlers
  const proxyHandlers = {
    get (target, param) {
      return Reflect.get(target, param)
    },
    async set (target, param, value) {
      const { redis } = fastify
      const key = `session_${target.session_id}`
      await redis.set(key, JSON.stringify(Object.assign(target, { [param]: value })) // Default maxLife to one day
      )
      return Reflect.set(target, param, value)
    }
  }
  // Register decorators
  fastify.decorateRequest('session', null)
  fastify.addHook('onRequest', async (request, reply) => {
    const { redis } = fastify
    let sessionKey = request.cookies.session_redis
    if (!sessionKey) {
      sessionKey = ulid()
      reply.cookie('session_redis', sessionKey)
    }
    const key = `session_${sessionKey}`
    let session = await redis.get(key)
    if (!session) {
      await redis.set(key, JSON.stringify({}))
      session = {}
    } else {
      session = JSON.parse(session)
    }
    session.session_id = sessionKey
    request.session = new Proxy(session, proxyHandlers)
  })
  next()
}

module.exports = fastifyPlugin(fastifyRedisSession, {
  fastify: '4.x',
  name: '@fastify/redis-session'
})
