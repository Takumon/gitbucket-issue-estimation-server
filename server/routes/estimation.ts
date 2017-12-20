import * as mongoose from 'mongoose';
import * as http from 'http';
import { Router, Response } from 'express';
import { check, oneOf, body, param, validationResult } from 'express-validator/check';

import { Estimation } from '../models/estimation.model';
import * as ENV from '../environment-config';


/**
 * DBアクセス時に指定する検索条件
 */
interface EstimationCondition {
  /** issueのid */
  issueId?: any;
}

/**
 * 指定されたリクエストから検索条件を組み立てる
 *
 * @param req リクエストオブジェクト
 * @param cb コールバック関数
 */
function createCondition(req: any): EstimationCondition {
  const query = req.query;
  const source = query.condition ?
    JSON.parse(query.condition) :
    {};

  const condition: EstimationCondition = {};

  // issueIdで絞り込み
  const issueIds = source.issueId
  if (issueIds) {
    condition.issueId = issueIds instanceof Array
     ? { $in: issueIds }
     : issueIds;
  }

  return condition;
}


const MODEL_NAME = 'issueの作業量';
const router: Router = Router();



/**
 * 複数件検索
 */
router.get('/', (req, res, next) => {

  Estimation
  .find(createCondition(req))
  .exec((err, estimations) => {

    if (err) {
      return res.status(500).json({
        title: `${MODEL_NAME}の検索に失敗しました。`,
        error: err.message
      });
    }

    return res.status(200).json(estimations);
  });
});



/**
 * 一件検索
 */
router.get('/:issueId', (req, res, next) => {

  const condition = { issueId: req.params.issueId };

  Estimation
    .find(condition)
    .exec((err, doc): any => {
      if (err) {
        return res.status(500).json({
          title: `${MODEL_NAME}の検索に失敗しました。`,
          error: err.message
        });
      }

      if (!doc[0]) {
        return res.status(404).json({
          title: `issue(issueId=${req.params.issueId})が見つかりませんでした。`,
        });
      }

      return res.status(200).json(doc[0]);
    });
});



/**
 * 一件登録
 */
router.post('/', [
  body('issueId')
    .not().isEmpty().withMessage('issueのIdを指定してください')
    .isNumeric().withMessage('issueのIdは数値型で指定してください'),
  body('estimation')
    .not().isEmpty().withMessage('issueの作業量を指定してください')
    .isNumeric().withMessage('issueの作業量は数値型で指定してください'),
], (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const model = new Estimation();
  model.issueId = req.body.issueId;
  model.estimation = req.body.estimation;

  model.save((err, updated) => {
    if (err) {
      return res.status(500).json({
        title: `${MODEL_NAME}の登録に失敗しました。`,
        error: err.message
      });
    }

    return res.status(200).json({
      message: `${MODEL_NAME}を登録しました。`,
      obj: updated
    });
  });
});


/**
 * 指定したidのissueがEstimationに存在するか
 *
 * @param issueId issueのid
 */
const isExistedEstimation = (issueId: String): Promise<boolean> => {
  return Estimation
    .findOne({ issueId: issueId})
    .exec()
    .then(target => {
      if (target) {
        // チェックOK
        return Promise.resolve(true);
      }
      return Promise.reject(false);
    // 検索失敗時はチェックNG
    }).catch(err => Promise.reject(false));
}


/**
 * 一件更新（差分更新）
 */
router.put('/:issueId', [
  param('issueId')
    .custom(isExistedEstimation).withMessage('指定したissueIdのissueは存在しません。'),
  body('estimation')
    .not().isEmpty().withMessage('issueの作業量を指定してください。')
    .isNumeric().withMessage('issueの作業量は数値型で指定してください'),
  ], (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const model = { estimation: req.body.estimation };

  Estimation.findOneAndUpdate({ 'issueId': req.params.issueId }, model, {new: true}, (err, target) => {

    if (err) {
      return res.status(500).json({
        title: `${MODEL_NAME}の更新に失敗しました。`,
        error: err.message
      });
    }

    return res.status(200).json({
      message: `${MODEL_NAME}を更新しました。`,
      obj: target
    });
  });
});


/**
 * 一件削除(物理削除)
 */
router.delete('/:issueId', [
  param('issueId')
  .custom(isExistedEstimation).withMessage('指定したissueIdのissueは存在しません。'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Estimation.findOneAndRemove( { issueId: req.params.issueId } , (error, taget) => {

    if (error) {
      return res.status(500).json({
          title:  `${MODEL_NAME}の削除に失敗しました。`,
          error: error.message
      });
    }

    return res.status(200).json({
      message: `${MODEL_NAME}を削除しました。`,
      obj: taget,
    });
  });
});

export { router as estimationRouter };
