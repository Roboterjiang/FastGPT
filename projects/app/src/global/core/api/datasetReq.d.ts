import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum,
  DatasetTypeEnum
} from '@fastgpt/global/core/dataset/constants';
import type { RequestPaging } from '@/types';
import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import type { SearchTestItemType } from '@/types/core/dataset';
import { UploadChunkItemType } from '@fastgpt/global/core/dataset/type';
import { DatasetCollectionSchemaType } from '@fastgpt/global/core/dataset/type';
import { PermissionTypeEnum } from '@fastgpt/global/support/permission/constant';
import type { LLMModelItemType } from '@fastgpt/global/core/ai/model.d';
import { TagItemType } from '@fastgpt/global/core/tag/type';

/* ===== dataset ===== */

/* ======= collections =========== */
export type GetDatasetCollectionsProps = RequestPaging & {
  datasetId: string;
  parentId?: string;
  searchText?: string;
  simple?: boolean;
  selectFolder?: boolean;
  kb_id?: string;
  user_id?: string;
  filterStatus?: string;
};

export type UpdateDatasetCollectionParams = {
  id: string;
  parentId?: string;
  name?: string;
  tagInfo?: TagItemType[];
};

export type BatchUpdateDatasetCollectionTag = {
  idList: string[];
  parentId?: string;
  tagInfo?: TagItemType[];
};

/* ==== data ===== */
export type GetDatasetDataListProps = RequestPaging & {
  searchText?: string;
  collectionId: string;
};
