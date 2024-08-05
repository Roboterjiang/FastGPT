import type { NextApiRequest } from 'next';
import { MongoConfigTag } from '@fastgpt/service/core/config/schema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';

import { NullPermission, WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest) {
  // auth
  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    authApiKey: true,
    per: WritePermissionVal
  });

  const allTags = await MongoConfigTag.find({});

  return allTags;
}

export default NextAPI(handler);
