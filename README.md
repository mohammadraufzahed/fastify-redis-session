# @ariodev/fastify-redis-session
![npm badge](https://img.shields.io/npm/v/@ariodev/fastify-redis-session)

A Fastify Redis session plugin that enables session management using Redis database. It requires both the @fastify/cookie and @fastify/redis plugins to function properly.

## Install

```bash
$ npm i @ariodev/fastify-redis-session
```

## Usage

```javascript
const fastify = require('fastify')
const fastifyRedisSession = require('@ariodev/fastify-redis-session')
const fastifyRedis = require('@fastify/redis')
const fastifyCookie = require('@fastify/cookie')

const app = fastify()

app.register(fastifyCookie, {
  secret: 'my-secret',
  hook: 'onRequest',
  parseOptions: {}
})
app.register(fastifyRedis, {
  url: 'redis://localhost'
})
app.register(fastifyRedisSession)
```

Set and Get data in the session by adding it to the session decorator at the request:

```javascript
app.post('/login', (req, res) => {
    // Checking the session for user
    if (req.session.username) {
        res.send('Already logged in')
    }
    // If user was not logged in
    else if (req.body.username == 'jhone' && req.body.password == '123456') {
        // You can pass data one by one
        req.session.username = req.body.username
        ...
        // Or you can overwrite the session object like this
        req.session = {
            username: req.body.username,
            ...
        }
        res.send('Logged in')
    }
})
```
