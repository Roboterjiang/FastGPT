import React from 'react';
import {
  Box,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Flex,
  Button
} from '@chakra-ui/react';
import { ImportDataSourceEnum, TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/user/useUserStore';
import { TabEnum } from '../../../index';
import {
  postCreateDatasetCsvTableCollection,
  postCreateDatasetExternalFileCollection,
  postCreateDatasetFileCollection,
  postCreateDatasetLinkCollection,
  postCreateDatasetTextCollection,
  vectorizeAdDatasetsDocs
} from '@/web/core/dataset/api';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import { useI18n } from '@/web/context/I18n';
import { useContextSelector } from 'use-context-selector';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { DatasetImportContext, type ImportFormType } from '../Context';
import { uploadFile2AidongDB } from '@/web/common/file/controller';

const Upload = ({ kb_id }: { kb_id: string }) => {
  const { t } = useTranslation();
  const { fileT } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const { userInfo } = useUserStore();
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);
  const { importSource, parentId, sources, setSources, processParamsForm, chunkSize } =
    useContextSelector(DatasetImportContext, (v) => v);

  const { handleSubmit } = processParamsForm;

  const { mutate: startUpload, isLoading } = useRequest({
    mutationFn: async ({ mode, customSplitChar, qaPrompt, webSelector, lang }: ImportFormType) => {
      if (sources.length === 0) return;
      const filterWaitingSources = sources.filter((item) => item.createStatus === 'waiting');

      // Batch create collection and upload chunks,
      for await (const item of filterWaitingSources) {
        setSources((state) =>
          state.map((source) =>
            source.id === item.id
              ? {
                  ...source,
                  createStatus: 'creating'
                }
              : source
          )
        );
        console.log('爱动开始上传文件', item);
        const uploadInfo = await uploadFile2AidongDB({
          kb_id: kb_id,
          user_id: userInfo._id,
          file: item.file,
          doc_type: mode
        });

        if (uploadInfo.status !== 'success') {
          //上传异常
          return new Promise((resolve, reject) => reject());
        }
        if (uploadInfo.data && uploadInfo.data.length > 0) {
          const serverFileId = uploadInfo.data[0].file_id;
          // create collection
          const commonParams = {
            parentId,
            trainingType: TrainingModeEnum.chunk,
            datasetId: datasetDetail._id,
            chunkSize,
            chunkSplitter: customSplitChar,
            qaPrompt,
            name: item.sourceName,
            adFileId: serverFileId,
            tagInfo: item.tagInfo
          };
          if (importSource === ImportDataSourceEnum.fileLocal && item.dbFileId) {
            await postCreateDatasetFileCollection({
              ...commonParams,
              fileId: item.dbFileId
            });
            //创建成功后，对单个文件进行向量化
            await vectorizeAdDatasetsDocs(userInfo._id, kb_id, serverFileId, lang);
          } else if (importSource === ImportDataSourceEnum.fileLink && item.link) {
            await postCreateDatasetLinkCollection({
              ...commonParams,
              link: item.link,
              metadata: {
                webPageSelector: webSelector
              }
            });
          } else if (importSource === ImportDataSourceEnum.fileCustom && item.rawText) {
            // manual collection
            await postCreateDatasetTextCollection({
              ...commonParams,
              text: item.rawText
            });
          } else if (importSource === ImportDataSourceEnum.csvTable && item.dbFileId) {
            await postCreateDatasetCsvTableCollection({
              ...commonParams,
              fileId: item.dbFileId
            });
          } else if (importSource === ImportDataSourceEnum.externalFile && item.externalFileUrl) {
            await postCreateDatasetExternalFileCollection({
              ...commonParams,
              externalFileUrl: item.externalFileUrl,
              externalFileId: item.externalFileId,
              filename: item.sourceName
            });
          }
          setSources((state) =>
            state.map((source) =>
              source.id === item.id
                ? {
                    ...source,
                    createStatus: 'finish'
                  }
                : source
            )
          );
        }
      }
    },
    onSuccess() {
      toast({
        title: '文件上传成功，等待索引中',
        status: 'success'
      });

      // close import page
      router.replace({
        query: {
          ...router.query,
          currentTab: TabEnum.collectionCard
        }
      });
    },
    onError() {
      setSources((state) =>
        state.map((source) =>
          source.createStatus === 'creating'
            ? {
                ...source,
                createStatus: 'waiting'
              }
            : source
        )
      );
    },
    errorToast: fileT('Upload failed')
  });

  return (
    <Box>
      <TableContainer>
        <Table variant={'simple'} fontSize={'sm'} draggable={false}>
          <Thead draggable={false}>
            <Tr bg={'myGray.100'} mb={2}>
              <Th borderLeftRadius={'md'} overflow={'hidden'} borderBottom={'none'} py={4}>
                {t('core.dataset.import.Source name')}
              </Th>
              <Th borderBottom={'none'} py={4}>
                {t('core.dataset.import.Upload status')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sources.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <Flex alignItems={'center'}>
                    <MyIcon name={item.icon as any} w={'16px'} mr={1} />
                    <Box whiteSpace={'wrap'} maxW={'30vw'}>
                      {item.sourceName}
                    </Box>
                  </Flex>
                </Td>
                <Td>
                  <Box display={'inline-block'}>
                    {item.createStatus === 'waiting' && (
                      <MyTag colorSchema={'gray'}>{t('common.Waiting')}</MyTag>
                    )}
                    {item.createStatus === 'creating' && (
                      <MyTag colorSchema={'blue'}>{t('common.Creating')}</MyTag>
                    )}
                    {item.createStatus === 'finish' && (
                      <MyTag colorSchema={'green'}>{t('common.Finish')}</MyTag>
                    )}
                  </Box>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Flex justifyContent={'flex-end'} mt={4}>
        <Button isLoading={isLoading} onClick={handleSubmit((data) => startUpload(data))}>
          {sources.length > 0
            ? `${t('core.dataset.import.Total files', { total: sources.length })} | `
            : ''}
          {t('core.dataset.import.Start upload')}
        </Button>
      </Flex>
    </Box>
  );
};

export default Upload;
