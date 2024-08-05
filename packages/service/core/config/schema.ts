import { ConfigTagSchemaType } from '@fastgpt/global/core/config/type.d';
import { connectionMongo, type Model } from '../../common/mongo';
const { Schema, model, models } = connectionMongo;
export const ConfigTagName = 'configTag';

const ConfigTagSchema = new Schema({
  tagKey: {
    type: String,
    required: true
  },
  tagValue: {
    type: String,
    required: true
  },
  user_id: {
    type: String
  }
});
export const MongoConfigTag: Model<ConfigTagSchemaType> =
  models[ConfigTagName] || model(ConfigTagName, ConfigTagSchema);
MongoConfigTag.syncIndexes();
