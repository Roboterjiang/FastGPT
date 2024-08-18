import { ParentTreePathItemType } from '@fastgpt/global/common/parentFolder/type';
import {
  DatasetCollectionSchemaType,
  DatasetDataSchemaType
} from '@fastgpt/global/core/dataset/type.d';
import { TagItemType } from '@fastgpt/global/core/tag/type';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';

/* ================= dataset ===================== */

/* ================= collection ===================== */
export type DatasetCollectionsListItemType = {
  _id: string;
  parentId?: string;
  tmbId: string;
  name: string;
  type: DatasetCollectionSchemaType['type'];
  updateTime: Date;
  dataAmount: number;
  trainingAmount: number;
  fileId?: string;
  rawLink?: string;
  permission: DatasetPermission;
  adFileId?: string;
  //表示向量化状态  1进行中 2.成功  3.失败
  status: number;
  tagInfo?: TagItemType[];
  doc_type?: string;
};

/* ================= data ===================== */
export type DatasetDataListItemType = {
  _id: string;
  datasetId: string;
  collectionId: string;
  q: string; // embedding content
  a: string; // bonus content
  chunkIndex?: number;
  indexes: DatasetDataSchemaType['indexes'];
};
