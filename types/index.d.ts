import { FastifyPluginCallback } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    session: fastifyRedisSession.Session
  }
}

type FastifyRedisSession = FastifyPluginCallback<fastifyRedisSession.RedisSessionPluginOptions>

declare namespace fastifyRedisSession {
  export type Session = {
    [key: string]: any | undefined
    session_id?: string
    save: () => void
    replace: (obj: Record<string, any>) => void
    delete: (key?: string) => void
    options: (opts: { maxAge?: number }) => void
    _options?: { maxAge?: number }
  }

  export type RedisSessionPluginOptions = {
    /** maxLife in seconds */
    maxLife?: number;
  }
  export const fastifyRedisSession: FastifyRedisSession;
  export {fastifyRedisSession as default}
}

declare function fastifyRedisSession(...params: Parameters<FastifyRedisSession>): ReturnType<FastifyRedisSession>
export = fastifyRedisSession
