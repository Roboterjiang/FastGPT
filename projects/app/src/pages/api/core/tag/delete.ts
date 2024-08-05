import type { NextApiRequest } from 'next';
import { MongoConfigTag } from '@fastgpt/service/core/config/schema';
import type { CreateTagParams } from '@/global/core/tag/api';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';

import { NullPermission, WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
async function handler(req: NextApiRequest) {
  const { id } = req.query as { id: string };
  // auth
  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    authApiKey: true,
    per: WritePermissionVal
  });

  await mongoSessionRun(async (session) => {
    // delete dataset data
    await MongoConfigTag.deleteMany(
      {
        _id: { $in: [id] }
      },
      { session }
    );
  });
}

export default NextAPI(handler);
