import type { NextApiRequest } from 'next';
import type {
  BatchUpdateDatasetCollectionTag,
  UpdateDatasetCollectionParams
} from '@/global/core/api/datasetReq.d';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { getCollectionUpdateTime } from '@fastgpt/service/core/dataset/collection/utils';
import { authDatasetCollection } from '@fastgpt/service/support/permission/dataset/auth';
import { NextAPI } from '@/service/middleware/entry';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

/**
 * 批量更新标签
 * @param req
 * @returns
 */
async function handler(req: NextApiRequest) {
  const { idList, parentId, tagInfo } = req.body as BatchUpdateDatasetCollectionTag;

  if (!idList || (idList && idList.length == 0)) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  // 凭证校验
  await authDatasetCollection({
    req,
    authToken: true,
    authApiKey: true,
    collectionId: idList[0],
    per: WritePermissionVal
  });

  const updateFields: Record<string, any> = {
    ...(parentId !== undefined && { parentId: parentId || null }),
    ...(tagInfo && { tagInfo, updateTime: getCollectionUpdateTime({ name: 'name' }) })
  };

  //批量更新知识库标签
  await MongoDatasetCollection.updateMany(
    {
      _id: { $in: idList }
    },
    {
      $set: updateFields
    }
  );
}

export default NextAPI(handler);
