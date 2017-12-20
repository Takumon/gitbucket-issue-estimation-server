import * as mongoose from 'mongoose';
import '../connection';

/**
 * issueの作業量を保存するためのモデル
 */
const EstimationSchema = new mongoose.Schema({
  issueId: Number,
  estimation: String,
});

const Estimation = mongoose.model('Estimation', EstimationSchema);

export { Estimation };
