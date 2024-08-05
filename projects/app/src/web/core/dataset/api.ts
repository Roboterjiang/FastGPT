import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type {
  ParentIdType,
  ParentTreePathItemType
} from '@fastgpt/global/common/parentFolder/type.d';
import type {
  DatasetItemType,
  DatasetListItemType,
  DatasetSimpleItemType
} from '@fastgpt/global/core/dataset/type.d';
import type {
  GetDatasetCollectionsProps,
  GetDatasetDataListProps,
  UpdateDatasetCollectionParams
} from '@/global/core/api/datasetReq.d';
import type {
  CreateDatasetCollectionParams,
  CsvTableCreateDatasetCollectionParams,
  DatasetUpdateBody,
  ExternalFileCreateDatasetCollectionParams,
  FileIdCreateDatasetCollectionParams,
  LinkCreateDatasetCollectionParams,
  PostWebsiteSyncParams,
  TextCreateDatasetCollectionParams
} from '@fastgpt/global/core/dataset/api.d';
import type {
  GetTrainingQueueProps,
  GetTrainingQueueResponse,
  SearchTestProps,
  SearchTestResponse
} from '@/global/core/dataset/api.d';
import type {
  UpdateDatasetDataProps,
  CreateDatasetParams,
  InsertOneDatasetDataProps
} from '@/global/core/dataset/api.d';
import type { DatasetCollectionItemType } from '@fastgpt/global/core/dataset/type';
import {
  DatasetCollectionSyncResultEnum,
  DatasetTypeEnum
} from '@fastgpt/global/core/dataset/constants';
import type { DatasetDataItemType } from '@fastgpt/global/core/dataset/type';
import type { DatasetCollectionsListItemType } from '@/global/core/dataset/type.d';
import { PagingData } from '@/types';
import type { getDatasetTrainingQueueResponse } from '@/pages/api/core/dataset/training/getDatasetTrainingQueue';
import type { rebuildEmbeddingBody } from '@/pages/api/core/dataset/training/rebuildEmbedding';
import type {
  PostPreviewFilesChunksProps,
  PreviewChunksResponse
} from '@/pages/api/core/dataset/file/getPreviewChunks';
import type { readCollectionSourceResponse } from '@/pages/api/core/dataset/collection/read';
import type { GetDatasetListBody } from '@/pages/api/core/dataset/list';

/* ======================== dataset ======================= */
export const getDatasets = (data: GetDatasetListBody) =>
  POST<DatasetListItemType[]>(`/core/dataset/list`, data);

/**
 * get type=dataset list
 */
export const getAllDataset = () => GET<DatasetSimpleItemType[]>(`/core/dataset/allDataset`);

export const getDatasetPaths = (parentId: ParentIdType) =>
  GET<ParentTreePathItemType[]>('/core/dataset/paths', { parentId });

export const getDatasetById = (id: string) => GET<DatasetItemType>(`/core/dataset/detail?id=${id}`);

export const postCreateDataset = (data: CreateDatasetParams) => {
  // createAdDatasets(data);
  return POST<string>(`/core/dataset/create`, data);
};

export const putDatasetById = (data: DatasetUpdateBody) => PUT<void>(`/core/dataset/update`, data);

export const delDatasetById = (id: string) => DELETE(`/core/dataset/delete?id=${id}`);

export const postWebsiteSync = (data: PostWebsiteSyncParams) =>
  POST(`/proApi/core/dataset/websiteSync`, data, {
    timeout: 600000
  }).catch();

/* =========== search test ============ */
export const postSearchText = (data: SearchTestProps) =>
  POST<SearchTestResponse>(`/core/dataset/searchTest`, data);

/* ============================= collections ==================================== */
export const getDatasetCollections = async (data: GetDatasetCollectionsProps) => {
  const result = await POST<PagingData<DatasetCollectionsListItemType>>(
    `/core/dataset/collection/list`,
    data
  );
  const aidongResult = await getAdDatasetsDocs(data.user_id, data.kb_id);

  //   console.log('爱动aidongResult', aidongResult);

  if (aidongResult && aidongResult.data && result.data.length > 0) {
    result.data.forEach((item) => {
      const findItem = aidongResult.data.find((x) => x.file_id === item.adFileId);
      if (findItem) {
        item.trainingAmount = findItem.status == 'green' ? 0 : 5;
        //表示向量化状态  1进行中 2.成功  3.失败
        item.status = findItem.status == 'green' ? 2 : findItem.status == 'red' ? 3 : 1;
      }
    });
  }
  //   console.log('爱动fastgptResult', result);
  return new Promise((resolve, reject) => {
    resolve(result);
  });
};
export const getDatasetCollectionPathById = (parentId: string) =>
  GET<ParentTreePathItemType[]>(`/core/dataset/collection/paths`, { parentId });
export const getDatasetCollectionById = (id: string) =>
  GET<DatasetCollectionItemType>(`/core/dataset/collection/detail`, { id });
export const postDatasetCollection = (data: CreateDatasetCollectionParams) =>
  POST<string>(`/core/dataset/collection/create`, data);
export const postCreateDatasetFileCollection = (data: FileIdCreateDatasetCollectionParams) =>
  POST<{ collectionId: string }>(`/core/dataset/collection/create/fileId`, data, {
    timeout: 120000
  });
export const postCreateDatasetLinkCollection = (data: LinkCreateDatasetCollectionParams) =>
  POST<{ collectionId: string }>(`/core/dataset/collection/create/link`, data);
export const postCreateDatasetTextCollection = (data: TextCreateDatasetCollectionParams) =>
  POST<{ collectionId: string }>(`/core/dataset/collection/create/text`, data);
export const postCreateDatasetCsvTableCollection = (data: CsvTableCreateDatasetCollectionParams) =>
  POST<{ collectionId: string }>(`/core/dataset/collection/create/csvTable`, data, {
    timeout: 120000
  });
export const postCreateDatasetExternalFileCollection = (
  data: ExternalFileCreateDatasetCollectionParams
) =>
  POST<{ collectionId: string }>(`/proApi/core/dataset/collection/create/externalFileUrl`, data, {
    timeout: 120000
  });

export const putDatasetCollectionById = (data: UpdateDatasetCollectionParams) =>
  POST(`/core/dataset/collection/update`, data);
export const delDatasetCollectionById = (params: { id: string }) =>
  DELETE(`/core/dataset/collection/delete`, params);
export const postLinkCollectionSync = (collectionId: string) =>
  POST<`${DatasetCollectionSyncResultEnum}`>(`/core/dataset/collection/sync/link`, {
    collectionId
  });

/* =============================== data ==================================== */
/* get dataset list */
export const getDatasetDataList = (data: GetDatasetDataListProps) =>
  POST(`/core/dataset/data/list`, data);

export const getDatasetDataItemById = (id: string) =>
  GET<DatasetDataItemType>(`/core/dataset/data/detail`, { id });

/**
 * insert one data to dataset (immediately insert)
 */
export const postInsertData2Dataset = (data: InsertOneDatasetDataProps) =>
  POST<string>(`/core/dataset/data/insertData`, data);

/**
 * update one datasetData by id
 */
export const putDatasetDataById = (data: UpdateDatasetDataProps) =>
  PUT('/core/dataset/data/update', data);
/**
 * 删除一条知识库数据
 */
export const delOneDatasetDataById = (id: string) =>
  DELETE<string>(`/core/dataset/data/delete`, { id });

/* ================ training ==================== */
export const postRebuildEmbedding = (data: rebuildEmbeddingBody) =>
  POST(`/core/dataset/training/rebuildEmbedding`, data);

/* get length of system training queue */
export const getTrainingQueueLen = (data: GetTrainingQueueProps) =>
  GET<GetTrainingQueueResponse>(`/core/dataset/training/getQueueLen`, data);
export const getDatasetTrainingQueue = (datasetId: string) =>
  GET<getDatasetTrainingQueueResponse>(`/core/dataset/training/getDatasetTrainingQueue`, {
    datasetId
  });

export const getPreviewChunks = (data: PostPreviewFilesChunksProps) =>
  POST<PreviewChunksResponse>('/core/dataset/file/getPreviewChunks', data);

/* ================== read source ======================== */
export const getCollectionSource = (collectionId: string) =>
  GET<readCollectionSourceResponse>('/core/dataset/collection/read', { collectionId });

/**爱动接口 获取知识库李彪 */
export const getAdDatasets = (user_id: string) =>
  GET<Object>('/aidong/kbqa/dbs', { user_id: 'user' + user_id });

/**创建知识库 */
export const createAdDatasets = (data: CreateDatasetParams) =>
  POST<string>(`/aidong/kbqa/dbs`, { ...data, user_id: 'user' + data.user_id });

/**删除知识库 */
export const deleteAdDatasets = (user_id: string, kb_id: string) =>
  DELETE<string>(`/aidong/kbqa/dbs`, { kb_ids: [kb_id], user_id: 'user' + user_id });

/**插入聊天记录到数据库中 */
export const insertChatItem2DB = (requestData: any) => POST(`/v1/chat/adcompletions`, requestData);

/**
 * 删除爱动知识库文档
 * @param params
 * @returns
 */
export const delAdDatasetDocs = (user_id: string, kb_id: string, adFileId: string) =>
  DELETE(`/aidong/kbqa/docs`, { user_id: 'user' + user_id, kb_id, file_ids: [adFileId] });

/**获取单个知识库的文档列表 */
export const getAdDatasetsDocs = (user_id: string, kb_id: string) =>
  GET<Object>('/aidong/kbqa/docs', { user_id: 'user' + user_id, kb_id });
/**
 *
 *向量化指定文件
 *  */
export const vectorizeAdDatasetsDocs = (
  user_id: string,
  kb_id: string,
  adFileId: string,
  lang: string
) => POST(`/aidong/kbqa/emb_kb`, { user_id: 'user' + user_id, kb_id, file_ids: [adFileId], lang });
