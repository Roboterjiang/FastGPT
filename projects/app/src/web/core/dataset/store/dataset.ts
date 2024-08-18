import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  DatasetListItemType,
  DatasetSimpleItemType
} from '@fastgpt/global/core/dataset/type.d';
import { getAllDataset, getDatasets, getAdDatasets } from '@/web/core/dataset/api';

import { getTokenLogin } from '@/web/support/user/api';

type State = {
  allDatasets: DatasetSimpleItemType[];
  loadAllDatasets: () => Promise<DatasetSimpleItemType[]>;
  myDatasets: DatasetListItemType[];
  loadMyDatasets: (parentId?: string, searchKey?: string) => Promise<any>;
};

export const useDatasetStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        allDatasets: [],
        async loadAllDatasets() {
          const res = await getAllDataset();
          set((state) => {
            state.allDatasets = res;
          });
          return res;
        },
        myDatasets: [],
        async loadMyDatasets(parentId = '', searchKey = '') {
          const res = await getDatasets({ parentId, searchKey });
          set((state) => {
            state.myDatasets = res;
          });
          return res;
        }
      })),
      {
        name: 'datasetStore',
        partialize: (state) => ({})
      }
    )
  )
);
