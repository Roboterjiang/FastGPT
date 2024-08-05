import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImportSourceItemType } from '@/web/core/dataset/type.d';
import { Box, Button } from '@chakra-ui/react';
import FileSelector from '../components/FileSelector';
import { useTranslation } from 'next-i18next';

import dynamic from 'next/dynamic';
import Loading from '@fastgpt/web/components/common/MyLoading';
import { RenderUploadFiles } from '../components/RenderFiles';
import { useContextSelector } from 'use-context-selector';
import { DatasetImportContext } from '../Context';

import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { uploadFile2AidongDB, uploadFile2DB } from '@/web/common/file/controller';
import { formatFileSize } from '@fastgpt/global/common/file/tools';
import { getFileIcon } from '@fastgpt/global/common/file/icon';
import { useUserStore } from '@/web/support/user/useUserStore';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import { useRouter } from 'next/router';
import { useToast } from '@fastgpt/web/hooks/useToast';

import { postCreateDatasetFileCollection, vectorizeAdDatasetsDocs } from '@/web/core/dataset/api';

import { TabEnum } from '../../../index';

export type SelectFileItemType = {
  fileId: string;
  folderPath: string;
  file: File;
};

const DataProcess = dynamic(() => import('../commonProgress/DataProcess'), {
  loading: () => <Loading fixed={false} />
});
const Upload = dynamic(() => import('../commonProgress/Upload'));

const fileType = '.txt, .docx, .csv, .xlsx, .pdf, .md, .pptx';

const FileLocal = ({ datasetId, kb_id }: { datasetId: string; kb_id: string }) => {
  const activeStep = useContextSelector(DatasetImportContext, (v) => v.activeStep);

  return (
    <>
      {activeStep === 0 && <SelectFile datasetId={datasetId} kb_id={kb_id} />}
      {activeStep === 1 && <DataProcess showPreviewChunks={true} />}
      {activeStep === 2 && <Upload kb_id={kb_id} />}
    </>
  );
};

export default React.memo(FileLocal);

const SelectFile = React.memo(function SelectFile({
  datasetId,
  kb_id
}: {
  datasetId: string;
  kb_id: string;
}) {
  //   console.log('爱动SelectFile', datasetId + '---' + kb_id);
  const { t } = useTranslation();
  const { goToNext, sources, setSources } = useContextSelector(DatasetImportContext, (v) => v);
  const [selectFiles, setSelectFiles] = useState<ImportSourceItemType[]>(
    sources.map((source) => ({
      isUploading: false,
      ...source
    }))
  );
  const [uploading, setUploading] = useState(false);
  const successFiles = useMemo(() => selectFiles.filter((item) => !item.errorMsg), [selectFiles]);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setSources(successFiles);
  }, [setSources, successFiles]);

  const onclickNext = useCallback(() => {
    // filter uploaded files
    setSelectFiles((state) => state.filter((item) => (item.uploadedFileRate || 0) >= 100));
    goToNext();
  }, [goToNext]);

  return (
    <Box>
      <FileSelector
        fileType={fileType}
        selectFiles={selectFiles}
        setSelectFiles={setSelectFiles}
        datasetId={datasetId}
        kb_id={kb_id}
        onStartSelect={() => setUploading(true)}
        onFinishSelect={() => setUploading(false)}
        isFileUploading={uploading}
      />

      {/* render files */}
      <RenderUploadFiles files={selectFiles} setFiles={setSelectFiles} showPreviewContent />

      <Box textAlign={'right'} mt={5}>
        <Button isDisabled={successFiles.length === 0 || uploading} onClick={onclickNext}>
          {selectFiles.length > 0
            ? `${t('core.dataset.import.Total files', { total: selectFiles.length })} | `
            : ''}
          {t('common.Next Step')}
        </Button>

        {/* <Button isDisabled={successFiles.length === 0 || uploading} onClick={startUpload}>
          {selectFiles.length > 0
            ? `${t('core.dataset.import.Total files', { total: selectFiles.length })} | `
            : ''}
          开始上传
        </Button> */}
      </Box>
    </Box>
  );
});
