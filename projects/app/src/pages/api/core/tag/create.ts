import type { NextApiRequest } from 'next';
import { MongoConfigTag } from '@fastgpt/service/core/config/schema';
import type { CreateTagParams } from '@/global/core/tag/api';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';

import { NullPermission, WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest) {
  const { tagKey, tagValue, user_id } = req.body as CreateTagParams;
  // auth
  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    authApiKey: true,
    per: WritePermissionVal
  });

  const { _id } = await MongoConfigTag.create({
    tagKey,
    tagValue,
    user_id,
    teamId,
    tmbId
  });
  return _id;
}

export default NextAPI(handler);
