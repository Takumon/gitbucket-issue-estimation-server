import * as mongoose from 'mongoose';
import '../connection';

/**
 * issueのメタ情報を保存するためのモデル
 */
const IssueSchema = new mongoose.Schema({
  /** リポジトリが所属するグループ名またはユーザ名 */
  owner: String,
  /** リポジトリ名 */
  repo: String,
  /** issue番号 */
  issueId: Number,
  /** issueの作業量 */
  estimation: Number,
});

const Issue = mongoose.model('Issue', IssueSchema);

export { Issue };
