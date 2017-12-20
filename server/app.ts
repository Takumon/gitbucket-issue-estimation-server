import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as util from 'util';
import * as config from 'config';

import * as ENV from './environment-config';
import { systemLogger, errorLogger, accessLogHandler } from './logger';
import { estimationRouter } from './routes/estimation';



class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    systemLogger.debug('NODE_ENV = ' + this.express.get('env'));
    systemLogger.debug('設定（環境変数）=' + util.inspect(ENV, {showHidden: false, depth: null}));
    systemLogger.debug('設定ファイル =' + util.inspect(config, {showHidden: false, depth: null}));
    this.middleware();
    this.routes();
  }

  private middleware(): void {
    this.express.use(bodyParser.json({limit: '50mb'}));
    this.express.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
    this.express.use(accessLogHandler);
    mongoose.Promise = global.Promise;
  }

  private routes(): void {
    this.express.use('/api/estimations', estimationRouter);
  }
}

export default new App().express;
