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
  UpdateDatasetCollectionParams,
  BatchUpdateDatasetCollectionTag
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
  let finalResult = {
    pageNum: 1,
    pageSize: 20,
    data: [],
    total: 0
  };
  const user_id = data.user_id;
  const kb_id = data.kb_id;

  const getStatusType = (status: string) => {
    switch (status) {
      case 'yellow':
        return 1;
      case 'green':
        return 2;
      case 'red':
        return 3;
      case 'gray':
        return 4;
      default:
        return 4;
    }
  };

  const getColorStatus = (status: string | undefined) => {
    switch (status) {
      case '1':
        return 'yellow';
      case '2':
        return 'green';
      case '3':
        return 'red';
      case '4':
        return 'gray';
      default:
        return '';
    }
  };

  const status = getColorStatus(data.filterStatus);

  const aidongResult = await getPageAdDatasetsDocs(
    user_id,
    kb_id,
    data.pageNum,
    status,
    data.docType,
    data.searchText
  );
  if (aidongResult && aidongResult.data) {
    const adFileIds = aidongResult.data.map((x) => x.file_id);
    const result = await POST<PagingData<DatasetCollectionsListItemType>>(
      `/core/dataset/collection/filterList`,
      { datasetId: data.datasetId, adFileIds: adFileIds }
    );
    result.data.forEach((item) => {
      const findItem = aidongResult.data.find((x) => x.file_id === item.adFileId);
      if (findItem) {
        //表示向量化状态  1进行中 2.成功  3.失败 4.未索引
        item.status = getStatusType(findItem.status);
        item.doc_type = findItem.doc_type;
      }
    });
    finalResult = {
      pageNum: data.pageNum,
      pageSize: 20,
      data: result.data,
      total: aidongResult.pagination.total
    };
  }
  return new Promise((resolve, reject) => {
    resolve(finalResult);
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

export const batchDelDatasetCollectionByIds = (params: { ids: string[] }) =>
  POST(`/core/dataset/collection/batchDelete`, params);
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

export const batchDelAdDatasetDocs = (user_id: string, kb_id: string, file_ids: string[]) =>
  DELETE(`/aidong/kbqa/docs`, { user_id: 'user' + user_id, kb_id, file_ids: file_ids });

/**获取单个知识库的文档列表-分页 */
export const getPageAdDatasetsDocs = (
  user_id: string | undefined,
  kb_id: string | undefined,
  page: number,
  status: string | undefined,
  doc_type: string | undefined,
  file_name: string | undefined
) => {
  const postData = {
    user_id: 'user' + user_id,
    kb_id,
    size: 20,
    page
  };
  if (status) {
    postData.status = status;
  }
  if (doc_type) {
    postData.doc_type = doc_type;
  }
  if (file_name) {
    postData.file_name = file_name;
  }
  return GET<Object>('/aidong/kbqa/docs', postData);
};

/**
 * 活动单个知识库文档列表
 * @param file_ids
 * @returns
 */
export const getAdDatasetsDocs = (file_ids: string[]) =>
  POST<Object>('/aidong/kbqa/doc_details', { file_ids });

/**
 *
 *向量化指定文件
 *  */
export const vectorizeAdDatasetsDocs = (user_id: string, kb_id: string, adFileIds: string[]) =>
  POST(`/aidong/kbqa/emb_kb`, { user_id: 'user' + user_id, kb_id, file_ids: adFileIds });

export const batchUpdateDatasetCollectionTags = (data: BatchUpdateDatasetCollectionTag) => {
  return POST(`/core/dataset/collection/batchUpdateTag`, data);
};

/**
 * 重命名知识库
 * @param user_id
 * @param kb_id
 * @param kb_name
 * @returns
 */
export const renameDataset = (user_id: string, kb_id: string, kb_name: string) =>
  POST(`/aidong/kbqa/rename_kb`, { user_id: 'user' + user_id, kb_id, kb_name });

export const checkDuplicateByNames = (user_id: string, kb_id: string, file_names: string[]) => {
  return POST(`/aidong/kbqa/doc_exists`, { user_id: 'user' + user_id, kb_id, file_names });
};
