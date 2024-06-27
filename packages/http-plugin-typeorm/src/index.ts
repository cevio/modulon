import TypeORM from '@modulon/typeorm';
import { Plugin } from '@modulon/http';
import { Context, Next } from 'koa';
import { DataSource, QueryRunner } from 'typeorm';

declare module 'koa' {
  interface BaseContext {
    $typeorm_connection?: DataSource | QueryRunner,
    $typeorm_transacation_rollback?: (roll: () => unknown) => number,
  }
}

export default class HttpTypeormPlugin extends Plugin {
  static readonly namespace = Symbol('typeorm:connection');

  public onCreate() {
    this.ctx.$module.addHook(HttpTypeormPlugin.namespace, () => this.ctx.$typeorm_connection);
  }

  public onRequest() { }
  public onResponse() { }

  static Middleware(useable?: boolean) {
    return async (ctx: Context, next: Next) => {
      const typeorm = await ctx.$module.use(TypeORM);
      if (useable) {
        await typeorm.transaction(async (runner, roll) => {
          ctx.$typeorm_connection = runner;
          ctx.$typeorm_transacation_rollback = roll;
          return await next();
        })
      } else {
        ctx.$typeorm_connection = typeorm.connection;
        await next();
      }
    }
  }
}
