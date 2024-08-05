import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type { CreateTagParams } from '@/global/core/tag/api';

/**
 * 创建一个模型
 */
export const postCreateConfigTag = (data: CreateTagParams) => {
  return POST<string>(`/core/tag/create`, data);
};

/**
 * 根据ID更新模型
 */
export const putConfigTagById = (data: CreateTagParams) => PUT<void>(`/core/tag/update`, data);

/**
 * 根据ID删除模型
 */
export const delConfigTagById = (id: string) => DELETE(`/core/tag/delete?id=${id}`);

/**
 * 根据user_id获取模型列表
 */
export const getConfigTagListByUid = (user_id: string) => POST<any>(`/core/tag/list`, { user_id });
