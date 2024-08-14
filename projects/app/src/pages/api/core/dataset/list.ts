import type { NextApiRequest } from 'next';
import type { DatasetListItemType } from '@fastgpt/global/core/dataset/type.d';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { getVectorModel } from '@fastgpt/service/core/ai/model';
import { NextAPI } from '@/service/middleware/entry';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import {
  PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { DatasetDefaultPermissionVal } from '@fastgpt/global/support/permission/dataset/constant';
import { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { parseParentIdInMongo } from '@fastgpt/global/common/parentFolder/utils';

export type GetDatasetListBody = {
  parentId: ParentIdType;
  searchKey?: string;
  type?: DatasetTypeEnum;
};

async function handler(req: NextApiRequest) {
  const { parentId, type, searchKey } = req.body as GetDatasetListBody;
  // 凭证校验
  const {
    teamId,
    tmbId,
    permission: tmbPer
  } = await authUserPer({
    req,
    authToken: true,
    authApiKey: true,
    per: ReadPermissionVal
  });

  const findDataSetQuery = (() => {
    const searchMatch = searchKey
      ? {
          $or: [
            { name: { $regex: searchKey, $options: 'i' } },
            { intro: { $regex: searchKey, $options: 'i' } }
          ]
        }
      : {};

    return {
      teamId,
      ...(type && Array.isArray(type) && { type: { $in: type } }),
      ...(type && { type }),
      ...parseParentIdInMongo(parentId),
      ...searchMatch
    };
  })();

  const [myDatasets, rpList] = await Promise.all([
    MongoDataset.find(findDataSetQuery)
      .sort({
        updateTime: -1
      })
      .lean(),
    MongoResourcePermission.find({
      resourceType: PerResourceTypeEnum.dataset,
      teamId,
      tmbId
    }).lean()
  ]);

  const filterDatasets = myDatasets
    .map((dataset) => {
      const perVal = rpList.find(
        (item) => String(item.resourceId) === String(dataset._id)
      )?.permission;
      const Per = new DatasetPermission({
        per: perVal ?? dataset.defaultPermission,
        isOwner: String(dataset.tmbId) === tmbId || tmbPer.isOwner
      });

      return {
        ...dataset,
        permission: Per
      };
    })
    .filter((app) => app.permission.hasReadPer);

  const data = await Promise.all(
    filterDatasets.map<DatasetListItemType>((item) => ({
      _id: item._id,
      parentId: item.parentId,
      avatar: item.avatar,
      name: item.name,
      intro: item.intro,
      type: item.type,
      kb_id: item.kb_id,
      permission: item.permission,
      vectorModel: getVectorModel(item.vectorModel),
      defaultPermission: item.defaultPermission ?? DatasetDefaultPermissionVal
    }))
  );

  return data;
}

export default NextAPI(handler);
