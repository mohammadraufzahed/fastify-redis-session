const fastify = require('fastify')()
const fastifyRedisSession = require('../')

fastify.register(require('@fastify/cookie'), {
  secret: 'my-secret',
  hook: 'onRequest',
  parseOptions: {}
})

fastify.register(require('@fastify/redis'), {
  url: 'redis://localhost'
})

fastify.register(fastifyRedisSession)

fastify.get('/', (req, res) => {
  return res.send(req.session.name)
})
fastify.get('/set', (req, res) => {
  req.session.name = 'Mohammad'
  return req.send('ok')
})

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    throw new Error(err)
  }
  console.log(address)
})
