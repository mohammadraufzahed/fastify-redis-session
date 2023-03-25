import fastifyRedisSession, { type Session } from ".";
import fastify, {
  FastifyRequest,
  FastifyInstance,
  FastifyReply,
} from "fastify";
import { expectType } from "tsd";
import fastifyCookie from "@fastify/cookie";
import fastifyRedis from "@fastify/redis";

type SessionData = {
    foo: string
}

const app: FastifyInstance = fastify();

app.register(fastifyCookie, {
  secret: 'my-secret',
  hook: 'onRequest',
  parseOptions: {}
});

app.register(fastifyRedis, {
  url: 'redis://localhost'
})

app.register(fastifyRedisSession, {})

app.get("/not-websockets", async (request, reply) => {
  expectType<FastifyRequest>(request);
  expectType<FastifyReply>(reply);
  expectType<Session>(request.session);
  request.session.foo = 'bar';
  expectType<any | undefined>(request.session.foo);
  expectType<any | undefined>(request.session.baz);
  expectType<Session>(request.session);
  request.session.delete();
  request.session.options({ maxAge: 42 });
});
