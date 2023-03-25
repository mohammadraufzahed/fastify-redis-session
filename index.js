const fastifyPlugin = require("fastify-plugin");

function fastifyRedisSession(fastify, options, next) {}

module.exports = fastifyPlugin(fastifyRedisSession, {
  fastify: "4.x",
  name: "@fastify/redis-session",
});
