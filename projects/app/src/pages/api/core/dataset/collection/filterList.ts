import type { NextApiRequest } from 'next';
import { Types } from '@fastgpt/service/common/mongo';
import type { DatasetCollectionsListItemType } from '@/global/core/dataset/type.d';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { NextAPI } from '@/service/middleware/entry';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';

/**
 * 根据adFileIds过滤数据
 * @param req
 * @returns
 */
async function handler(req: NextApiRequest) {
  let { datasetId, adFileIds } = req.body as { datasetId: string; adFileIds: string[] };

  // auth dataset and get my role
  const { teamId, permission } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    datasetId,
    per: ReadPermissionVal
  });

  const match = {
    teamId: new Types.ObjectId(teamId),
    datasetId: new Types.ObjectId(datasetId),
    //查找所有的 in  adFileIds
    adFileId: { $in: adFileIds }
  };

  const [collections]: [DatasetCollectionsListItemType[]] = await Promise.all([
    MongoDatasetCollection.aggregate([
      {
        $match: match
      },
      {
        $sort: { updateTime: -1 }
      },
      {
        $project: {
          _id: 1,
          parentId: 1,
          tmbId: 1,
          name: 1,
          type: 1,
          status: 1,
          updateTime: 1,
          fileId: 1,
          adFileId: 1,
          rawLink: 1,
          tagInfo: 1,
          dataAmount: {
            $ifNull: [{ $arrayElemAt: ['$dataCount.count', 0] }, 0]
          },
          trainingAmount: {
            $ifNull: [{ $arrayElemAt: ['$trainingCount.count', 0] }, 0]
          }
        }
      }
    ])
  ]);

  const data = await Promise.all(
    collections.map(async (item) => ({
      ...item,
      permission
    }))
  );
  return { data };
}

export default NextAPI(handler);
