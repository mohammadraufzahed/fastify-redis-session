const fastifyPlugin = require('fastify-plugin')

function fastifyRedisSession (fastify, options, next) {
  // Check the required plugins
  if (!fastify.hasPlugin('@fastify/cookie')) {
    throw new Error('@fastify/cookie plugin required')
  }
  if (!fastify.hasPlugin('@fastify/redis')) {
    throw new Error('@fastify/redis plugin required')
  }
  fastify.addHook('onRequest', async (request, reply) => {
    console.dir(request.cookies)
  })
  next()
}

module.exports = fastifyPlugin(fastifyRedisSession, {
  fastify: '4.x',
  name: '@fastify/redis-session'
})
