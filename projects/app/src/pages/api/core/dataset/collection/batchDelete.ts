import type { NextApiRequest } from 'next';
import { authDatasetCollection } from '@fastgpt/service/support/permission/dataset/auth';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { NextAPI } from '@/service/middleware/entry';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
async function handler(req: NextApiRequest) {
  const { ids: collectionIds } = req.body as { ids: string[] };

  if (!collectionIds || !collectionIds.length) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const { teamId, collection } = await authDatasetCollection({
    req,
    authToken: true,
    authApiKey: true,
    collectionId: collectionIds[0],
    per: WritePermissionVal
  });

  // delete
  await mongoSessionRun((session) => {
    return MongoDatasetCollection.deleteMany(
      {
        teamId,
        _id: { $in: collectionIds }
      },
      { session }
    );
  });
}

export default NextAPI(handler);
