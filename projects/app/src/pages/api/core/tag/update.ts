import type { NextApiRequest } from 'next';
import { MongoConfigTag } from '@fastgpt/service/core/config/schema';
import type { CreateTagParams } from '@/global/core/tag/api';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';

import { NullPermission, WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest) {
  const { tagKey, tagValue, _id } = req.body as CreateTagParams;
  // auth
  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    authApiKey: true,
    per: WritePermissionVal
  });
  return await MongoConfigTag.findOneAndUpdate(
    {
      _id
    },
    {
      tagKey,
      tagValue
    }
  );
}

export default NextAPI(handler);
