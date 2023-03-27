import { FastifyPluginCallback } from "fastify";

declare module "fastify" {
 interface FastifyRequest {
    session: fastifyRedisSession.Session
 }   
}
type FastifyRedisSession = FastifyPluginCallback<fastifyRedisSession.RedisSessionPluginOptions>

declare namespace fastifyRedisSession {
        export type Session = {
            [key: string]:  any | undefined
        }
    export type RedisSessionPluginOptions = {
        maxLife?: number;
    }
    export const fastifyRedisSession: FastifyRedisSession;
    export {fastifyRedisSession as default}
}

declare function fastifyRedisSession(...params: Parameters<FastifyRedisSession>): ReturnType<FastifyRedisSession>
export = fastifyRedisSession
