/* schema */
export type ConfigTagSchemaType = {
  _id: string;
  user_Id?: string;
  tagValue: string;
  tagKey: string;
};
export type TagItemType = {
  _id?: string | undefined;
  tagValue: string;
  tagKey: string;
};

export type SelectTagFormValues = {
  key: string;
  values: TagItemType[];
};

/**
 * 提交时的数据结构
 */
export type SubmitFormTagValues = {
  key: string;
  values: string[];
};
