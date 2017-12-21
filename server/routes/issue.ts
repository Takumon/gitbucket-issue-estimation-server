import * as mongoose from 'mongoose';
import * as http from 'http';
import { Router, Response } from 'express';
import { check, oneOf, body, param, validationResult } from 'express-validator/check';

import { Issue } from '../models/issue.model';
import * as ENV from '../environment-config';


/**
 * DBアクセス時に指定する検索条件
 */
interface IssueCondition {
  owner: string;
  repo: string;
  /** issueのid */
  issueId?: any;
}

/**
 * 指定されたリクエストから検索条件を組み立てる
 *
 * @param req リクエストオブジェクト
 * @param cb コールバック関数
 */
function createCondition(req: any): IssueCondition {
  const query = req.query;
  const source = query.condition ?
    JSON.parse(query.condition) :
    {};

  const condition: IssueCondition = {
    owner: req.params.owner,
    repo: req.params.repo
  };

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
router.get('/:owner/:repo/issues', [
  param('owner')
    .not().isEmpty().withMessage('リポジトリのグループまたはユーザを指定してください。'),
  param('repo')
    .not().isEmpty().withMessage('リポジトリを指定してください。'),
], (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Issue
  .find(createCondition(req))
  .exec((err, issues) => {

    if (err) {
      return res.status(500).json({
        title: `${MODEL_NAME}の検索に失敗しました。`,
        error: err.message
      });
    }

    return res.status(200).json(issues);
  });
});



/**
 * 一件検索
 */
router.get('/:owner/:repo/issues/:issueId', [
  param('owner')
    .not().isEmpty().withMessage('リポジトリのグループまたはユーザを指定してください。'),
  param('repo')
    .not().isEmpty().withMessage('リポジトリを指定してください。'),
  check('issueId')
    .not().isEmpty().withMessage('issueIdを指定してください。'),
], (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const condition = {
    owner: req.params.owner,
    repo: req.params.repo,
    issueId: req.params.issueId
  };

  Issue
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
 * 指定したidのissueが存在するか
 *
 * @param issueId issueのid
 */
const isExistedIssue = (issueId: String): Promise<boolean> => {
  return Issue
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
 * 一件更新または登録
 */
router.put('/:owner/:repo/issues/:issueId', [
  param('owner')
    .not().isEmpty().withMessage('リポジトリのグループまたはユーザを指定してください。'),
  param('repo')
    .not().isEmpty().withMessage('リポジトリを指定してください。'),
  param('issueId')
    .not().isEmpty().withMessage('issueのIdを指定してください。'),
  body('estimation')
    .not().isEmpty().withMessage('issueの作業量を指定してください。')
    .isNumeric().withMessage('issueの作業量は数値型で指定してください'),
  ], (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const modelKey = {
    owner: req.params.owner,
    repo: req.params.repo,
    issueId: req.params.issueId,
  };

  const model = {
    owner: req.params.owner,
    repo: req.params.repo,
    issueId: req.params.issueId,
    estimation: req.body.estimation
  };

  Issue.findOneAndUpdate(modelKey, model, {upsert: true, new: true}, (err, target) => {

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
router.delete('/:owner/:repo/issues/:issueId', [
  param('owner')
    .not().isEmpty().withMessage('リポジトリのグループまたはユーザを指定してください。'),
  param('repo')
    .not().isEmpty().withMessage('リポジトリを指定してください。'),
  param('issueId')
  .custom(isExistedIssue).withMessage('指定したissueIdのissueは存在しません。'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  Issue.findOneAndRemove( { issueId: req.params.issueId } , (error, taget) => {

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

export { router as issueRouter };
