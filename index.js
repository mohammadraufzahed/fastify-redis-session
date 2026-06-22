const fastifyPlugin = require('fastify-plugin')
const { ulid } = require('ulid')

function fastifyRedisSession (fastify, options = {}, next) {
  // Check the required plugins
  if (!fastify.hasPlugin('@fastify/cookie')) {
    throw new Error('@fastify/cookie plugin required')
  }
  if (!fastify.hasPlugin('@fastify/redis')) {
    throw new Error('@fastify/redis plugin required')
  }

  const maxLife = options.maxLife // in seconds

  // Helper to persist a snapshot to redis (fire-and-forget)
  function persistToRedis (sessionId, snapshot) {
    try {
      const key = `session_${sessionId}`
      const toStore = Object.assign({}, snapshot)
      delete toStore.session_id
      // Use set + expire for broad client compatibility
      const { redis } = fastify
      if (!redis) return Promise.resolve()
      return redis.set(key, JSON.stringify(toStore))
        .then(() => {
          if (maxLife && typeof redis.expire === 'function') {
            return redis.expire(key, maxLife)
          }
          return undefined
        })
        .catch((err) => {
          if (fastify.log && typeof fastify.log.error === 'function') fastify.log.error(err)
        })
    } catch (err) {
      if (fastify.log && typeof fastify.log.error === 'function') fastify.log.error(err)
      return Promise.resolve()
    }
  }

  // Proxy Handlers
  const proxyHandlers = {
    get (target, prop) {
      return Reflect.get(target, prop)
    },
    set (target, prop, value) {
      const sessionId = target && target.session_id
      // update in-memory
      const result = Reflect.set(target, prop, value)
      // persist asynchronously
      if (sessionId) {
        const snapshot = Object.assign({}, target)
        // ensure internal fields are not stored
        delete snapshot.session_id
        persistToRedis(sessionId, snapshot)
      }
      return result
    },
    deleteProperty (target, prop) {
      const sessionId = target && target.session_id
      const result = Reflect.deleteProperty(target, prop)
      if (sessionId) {
        const snapshot = Object.assign({}, target)
        delete snapshot.session_id
        persistToRedis(sessionId, snapshot)
      }
      return result
    }
  }

  // Register decorators
  fastify.decorateRequest('session', null)

  fastify.addHook('onRequest', async (request, reply) => {
    const { redis } = fastify
    let sessionKey = request.cookies && request.cookies.session_redis
    if (!sessionKey) {
      sessionKey = ulid()
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      }
      if (maxLife) cookieOptions.maxAge = maxLife * 1000 // ms
      // set cookie with safer defaults
      reply.cookie('session_redis', sessionKey, cookieOptions)
    }

    const key = `session_${sessionKey}`
    let session = {}

    // Try to load session from redis
    try {
      if (redis && typeof redis.get === 'function') {
        const raw = await redis.get(key)
        if (!raw) {
          // initialize empty object in redis
          await redis.set(key, JSON.stringify({}))
          if (maxLife && typeof redis.expire === 'function') await redis.expire(key, maxLife)
          session = {}
        } else {
          try {
            session = JSON.parse(raw)
          } catch (err) {
            if (fastify.log && typeof fastify.log.warn === 'function') fastify.log.warn('fastify-redis-session: failed to parse session data, resetting session', err)
            session = {}
          }
        }
      } else {
        // no redis client: fallback to empty session
        session = {}
      }
    } catch (err) {
      // Redis error: log and fallback to an in-memory session to keep the app functioning
      if (fastify.log && typeof fastify.log.error === 'function') fastify.log.error('fastify-redis-session: redis error', err)
      session = {}
    }

    // attach session metadata and helper methods
    session.session_id = sessionKey

    // save helper: persists the whole session
    session.save = function () {
      const snapshot = Object.assign({}, this)
      const sid = snapshot.session_id
      delete snapshot.session_id
      // persist asynchronously
      if (sid) persistToRedis(sid, snapshot)
    }

    // replace helper: replace session content and persist
    session.replace = function (newObj) {
      // remove existing keys
      Object.keys(this).forEach((k) => { delete this[k] })
      Object.assign(this, newObj || {})
      this.session_id = sessionKey
      this.save()
    }

    // delete helper: remove a key and persist
    session.delete = function (prop) {
      if (prop && Object.prototype.hasOwnProperty.call(this, prop)) {
        delete this[prop]
        this.save()
      }
    }

    // options helper: allow setting per-session options (e.g., maxAge) that will be used on save
    session.options = function (opts) {
      // Only store as runtime metadata; do not persist options into redis payload
      this._options = Object.assign({}, this._options || {}, opts || {})
      // If maxAge provided, persist by setting redis TTL on next save
      if (this._options && typeof this._options.maxAge === 'number') {
        // convert ms to seconds
        const ttlSec = Math.ceil(this._options.maxAge / 1000)
        const sid = this.session_id
        if (sid && fastify.redis && typeof fastify.redis.expire === 'function') {
          fastify.redis.expire(`session_${sid}`, ttlSec).catch((err) => { if (fastify.log && typeof fastify.log.error === 'function') fastify.log.error(err) })
        }
      }
    }

    request.session = new Proxy(session, proxyHandlers)
  })

  next()
}

module.exports = fastifyPlugin(fastifyRedisSession, {
  fastify: '4.x',
  name: '@fastify/redis-session'
})
