import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Flex,
  MenuButton,
  Button,
  Link,
  useTheme,
  useDisclosure,
  Toast,
  Select
} from '@chakra-ui/react';
import {
  getDatasetCollectionPathById,
  postDatasetCollection,
  putDatasetCollectionById,
  batchDelAdDatasetDocs,
  batchDelDatasetCollectionByIds,
  vectorizeAdDatasetsDocs
} from '@/web/core/dataset/api';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyInput from '@/components/MyInput';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useEditTitle } from '@/web/common/hooks/useEditTitle';
import {
  DatasetCollectionTypeEnum,
  TrainingModeEnum,
  DatasetTypeEnum,
  DatasetTypeMap,
  DatasetStatusEnum
} from '@fastgpt/global/core/dataset/constants';
import EditFolderModal, { useEditFolder } from '../../../component/EditFolderModal';
import { TabEnum } from '../../index';
import ParentPath from '@/components/common/ParentPaths';
import dynamic from 'next/dynamic';

import { ImportDataSourceEnum } from '@fastgpt/global/core/dataset/constants';
import { useContextSelector } from 'use-context-selector';
import { CollectionPageContext } from './Context';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useUserStore } from '@/web/support/user/useUserStore';

const FileSourceSelector = dynamic(() => import('../Import/components/FileSourceSelector'));

const Header = ({
  selectedItems,
  selectFileIds,
  showTagModal,
  onBatchDeleteSuccess
}: {
  selectedItems: string[];
  selectFileIds: string[];
  showTagModal: () => void;
  onBatchDeleteSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { setLoading } = useSystemStore();

  const { toast } = useToast();
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);

  const router = useRouter();
  const { userInfo } = useUserStore();
  const { parentId = '' } = router.query as { parentId: string; datasetId: string };
  const { isPc } = useSystemStore();

  const lastSearch = useRef('');
  const {
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    docType,
    setDocType,
    total,
    getData,
    pageNum,
    onOpenWebsiteModal
  } = useContextSelector(CollectionPageContext, (v) => v);

  // change search
  const debounceRefetch = useCallback(
    debounce(() => {
      getData(1);
      lastSearch.current = searchText;
    }, 300),
    []
  );

  const { data: paths = [] } = useQuery(['getDatasetCollectionPathById', parentId], () =>
    getDatasetCollectionPathById(parentId)
  );

  const { editFolderData, setEditFolderData } = useEditFolder();
  const { onOpenModal: onOpenCreateVirtualFileModal, EditModal: EditCreateVirtualFileModal } =
    useEditTitle({
      title: t('dataset.Create manual collection'),
      tip: t('dataset.Manual collection Tip'),
      canEmpty: false
    });

  const { openConfirm: openBatchDeleteConfirm, ConfirmModal: ConfirmBatchDeleteModal } = useConfirm(
    {
      content: t('dataset.Confirm to batch delete selected files'),
      type: 'delete'
    }
  );

  const { openConfirm: openBatchEmConfirm, ConfirmModal: ConfirmBatchEmModal } = useConfirm({
    content: t('dataset.Confirm to batch index selected files'),
    type: 'delete'
  });

  const {
    isOpen: isOpenFileSourceSelector,
    onOpen: onOpenFileSourceSelector,
    onClose: onCloseFileSourceSelector
  } = useDisclosure();

  const { mutate: onCreateCollection } = useRequest({
    mutationFn: async ({
      name,
      type,
      callback,
      ...props
    }: {
      name: string;
      type: DatasetCollectionTypeEnum;
      callback?: (id: string) => void;
      trainingType?: TrainingModeEnum;
      rawLink?: string;
      chunkSize?: number;
    }) => {
      setLoading(true);
      const id = await postDatasetCollection({
        parentId,
        datasetId: datasetDetail._id,
        name,
        type,
        ...props
      });
      callback?.(id);
      return id;
    },
    onSuccess() {
      getData(pageNum);
    },
    onSettled() {
      setLoading(false);
    },

    successToast: t('common.Create Success'),
    errorToast: t('common.Create Failed')
  });

  const handleStatusFilterChange = (event: any) => {
    setFilterStatus(event.target.value);
    debounceRefetch();
  };

  const handleDocTypeFilterChange = (event: any) => {
    setDocType(event.target.value);
    debounceRefetch();
  };

  return (
    <Flex px={[2, 6]} alignItems={'flex-start'} h={'35px'}>
      <Box flex={1}></Box>

      {/* search input */}
      {isPc && (
        <Flex alignItems={'center'} mr={4}>
          <MyInput
            bg={'myGray.50'}
            w={['100%', '200px']}
            size={'sm'}
            h={'36px'}
            placeholder={t('common.Search') || ''}
            value={searchText}
            leftIcon={
              <MyIcon
                name="common/searchLight"
                position={'absolute'}
                w={'16px'}
                color={'myGray.500'}
              />
            }
            onChange={(e) => {
              setSearchText(e.target.value);
              debounceRefetch();
            }}
            onBlur={() => {
              if (searchText === lastSearch.current) return;
              getData(1);
            }}
            onKeyDown={(e) => {
              if (searchText === lastSearch.current) return;
              if (e.key === 'Enter') {
                getData(1);
              }
            }}
          />
          {/* 1索引中 2.已就绪  3.失败 4.未索引 5排队中 */}
          <Select
            colorScheme={'red'}
            w={['100%', '200px']}
            h={'36px'}
            ml={3}
            value={filterStatus}
            onChange={handleStatusFilterChange}
            placeholder={t('common.Status')}
          >
            <option value="4">{t('dataset.Not indexed')}</option>
            <option value="5">{t('dataset.Queuing')}</option>
            <option value="1">{t('dataset.Indexing')}</option>
            <option value="2">{t('core.dataset.collection.status.active')}</option>
            <option value="3">{t('dataset.Indexing failed')}</option>
          </Select>

          <Select
            colorScheme={'red'}
            w={['100%', '200px']}
            h={'36px'}
            ml={3}
            value={docType}
            onChange={handleDocTypeFilterChange}
            placeholder={t('dataset.Document type')}
          >
            <option value="general">{t('dataset.General document')}</option>
            <option value="error_code">{t('dataset.Error code')}</option>
            <option value="diagram">{t('dataset.Chart')}</option>
            <option value="appearance">{t('dataset.Appearance')}</option>
            <option value="video">{t('dataset.Video')}</option>
          </Select>
        </Flex>
      )}

      {/* diff collection button */}
      {datasetDetail.permission.hasWritePer && (
        <>
          {datasetDetail?.type === DatasetTypeEnum.dataset && (
            <>
              <Flex
                alignItems={'center'}
                px={5}
                py={2}
                borderRadius={'md'}
                cursor={'pointer'}
                bg={'primary.500'}
                overflow={'hidden'}
                color={'white'}
                h={['28px', '35px']}
                onClick={() => {
                  setDocType('');
                  setFilterStatus('');
                  setSearchText('');
                  debounceRefetch();
                }}
              >
                <Box>{t('dataset.Reset')}</Box>
              </Flex>
              <MyMenu
                offset={[0, 5]}
                Button={
                  <MenuButton
                    _hover={{
                      color: 'primary.500'
                    }}
                    fontSize={['sm', 'md']}
                    ml={3}
                  >
                    <Flex
                      alignItems={'center'}
                      px={5}
                      py={2}
                      borderRadius={'md'}
                      cursor={'pointer'}
                      bg={'primary.500'}
                      overflow={'hidden'}
                      color={'white'}
                      h={['28px', '35px']}
                    >
                      <MyIcon name={'common/importLight'} mr={2} w={'14px'} />
                      <Box>{t('dataset.collections.Create And Import')}</Box>
                    </Flex>
                  </MenuButton>
                }
                menuList={[
                  {
                    children: [
                      {
                        label: <Flex>{t('dataset.General document')}</Flex>,
                        onClick: () => {
                          router.replace({
                            query: {
                              ...router.query,
                              currentTab: TabEnum.import,
                              source: ImportDataSourceEnum.fileLocal,
                              doc_type: 'general'
                            }
                          });
                        }
                      },
                      {
                        label: <Flex>{t('dataset.Error code')}</Flex>,
                        onClick: () => {
                          router.replace({
                            query: {
                              ...router.query,
                              currentTab: TabEnum.import,
                              source: ImportDataSourceEnum.fileLocal,
                              doc_type: 'error_code'
                            }
                          });
                        }
                      },
                      {
                        label: <Flex>{t('dataset.Chart')}</Flex>,
                        onClick: () => {
                          router.replace({
                            query: {
                              ...router.query,
                              currentTab: TabEnum.import,
                              source: ImportDataSourceEnum.fileLocal,
                              doc_type: 'diagram'
                            }
                          });
                        }
                      },
                      {
                        label: <Flex>{t('dataset.Appearance')}</Flex>,
                        onClick: () => {
                          router.replace({
                            query: {
                              ...router.query,
                              currentTab: TabEnum.import,
                              source: ImportDataSourceEnum.fileLocal,
                              doc_type: 'appearance'
                            }
                          });
                        }
                      },
                      {
                        label: <Flex>{t('dataset.Video')}</Flex>,
                        onClick: () => {
                          router.replace({
                            query: {
                              ...router.query,
                              currentTab: TabEnum.import,
                              source: ImportDataSourceEnum.fileLocal,
                              doc_type: 'video'
                            }
                          });
                        }
                      }
                    ]
                  }
                ]}
              />

              <MyMenu
                offset={[0, 5]}
                Button={
                  <MenuButton
                    _hover={{
                      color: 'primary.500'
                    }}
                    fontSize={['sm', 'md']}
                    ml={3}
                  >
                    <Flex
                      alignItems={'center'}
                      px={5}
                      py={2}
                      borderRadius={'md'}
                      cursor={'pointer'}
                      bg={'primary.500'}
                      overflow={'hidden'}
                      color={'white'}
                      h={['28px', '35px']}
                    >
                      <Box>{t('dataset.Batch operation')}</Box>
                    </Flex>
                  </MenuButton>
                }
                menuList={[
                  {
                    children: [
                      {
                        label: <Flex>{t('dataset.Batch set tags')}</Flex>,
                        onClick: () => {
                          if (selectedItems.length == 0) {
                            toast({
                              status: 'warning',
                              title: t('dataset.Please select data first')
                            });
                            return;
                          } else {
                            showTagModal();
                          }
                        }
                      },
                      {
                        label: <Flex>{t('dataset.Batch index')}</Flex>,
                        onClick: () => {
                          if (selectedItems.length == 0) {
                            toast({
                              status: 'warning',
                              title: t('dataset.Please select data first')
                            });
                            return;
                          } else {
                            //批量索引

                            openBatchEmConfirm(async () => {
                              const userId = userInfo?._id || '';
                              const kb_id = router.query.kb_id || '';
                              const result = await vectorizeAdDatasetsDocs(
                                userId,
                                kb_id,
                                selectFileIds
                              );
                              if (result && result.status == 'success') {
                                //批量删除collection
                                toast({
                                  status: 'success',
                                  title: t('dataset.Batch indexing successful')
                                });
                                onBatchDeleteSuccess();
                              } else {
                                toast({
                                  status: 'error',
                                  title: result.message ? result.message : t('common.Delete Failed')
                                });
                              }
                            })();
                          }
                        }
                      },
                      {
                        label: <Flex>{t('dataset.Batch delete')}</Flex>,
                        onClick: () => {
                          if (selectedItems.length == 0) {
                            toast({
                              status: 'warning',
                              title: t('dataset.Please select data first')
                            });
                            return;
                          } else {
                            //批量删除
                            openBatchDeleteConfirm(async () => {
                              const userId = userInfo?._id || '';
                              const kb_id = router.query.kb_id || '';
                              const result = await batchDelAdDatasetDocs(
                                userId,
                                kb_id,
                                selectFileIds
                              );
                              if (result && result.status == 'success') {
                                //批量删除collection
                                await batchDelDatasetCollectionByIds({ ids: selectedItems });
                                toast({
                                  status: 'success',
                                  title: t('dataset.Batch delete successful')
                                });
                                onBatchDeleteSuccess();
                              } else {
                                toast({
                                  status: 'error',
                                  title: result.message ? result.message : t('common.Delete Failed')
                                });
                              }
                            })();
                          }
                        }
                      }
                    ]
                  }
                ]}
              />
            </>
          )}
          {datasetDetail?.type === DatasetTypeEnum.websiteDataset && (
            <>
              {datasetDetail?.websiteConfig?.url ? (
                <Flex alignItems={'center'}>
                  {datasetDetail.status === DatasetStatusEnum.active && (
                    <Button onClick={onOpenWebsiteModal}>{t('common.Config')}</Button>
                  )}
                  {datasetDetail.status === DatasetStatusEnum.syncing && (
                    <Flex
                      ml={3}
                      alignItems={'center'}
                      px={3}
                      py={1}
                      borderRadius="md"
                      border={theme.borders.base}
                    >
                      <Box
                        animation={'zoomStopIcon 0.5s infinite alternate'}
                        bg={'myGray.700'}
                        w="8px"
                        h="8px"
                        borderRadius={'50%'}
                        mt={'1px'}
                      ></Box>
                      <Box ml={2} color={'myGray.600'}>
                        {t('core.dataset.status.syncing')}
                      </Box>
                    </Flex>
                  )}
                </Flex>
              ) : (
                <Button onClick={onOpenWebsiteModal}>{t('core.dataset.Set Website Config')}</Button>
              )}
            </>
          )}
          {datasetDetail?.type === DatasetTypeEnum.externalFile && (
            <MyMenu
              offset={[0, 5]}
              Button={
                <MenuButton
                  _hover={{
                    color: 'primary.500'
                  }}
                  fontSize={['sm', 'md']}
                >
                  <Flex
                    alignItems={'center'}
                    px={5}
                    py={2}
                    borderRadius={'md'}
                    cursor={'pointer'}
                    bg={'primary.500'}
                    overflow={'hidden'}
                    color={'white'}
                    h={['28px', '35px']}
                  >
                    <MyIcon name={'common/importLight'} mr={2} w={'14px'} />
                    <Box>{t('dataset.collections.Create And Import')}</Box>
                  </Flex>
                </MenuButton>
              }
              menuList={[
                {
                  children: [
                    {
                      label: (
                        <Flex>
                          <MyIcon name={'common/folderFill'} w={'20px'} mr={2} />
                          {t('Folder')}
                        </Flex>
                      ),
                      onClick: () => setEditFolderData({})
                    },
                    {
                      label: (
                        <Flex>
                          <MyIcon name={'core/dataset/fileCollection'} mr={2} w={'20px'} />
                          {t('core.dataset.Text collection')}
                        </Flex>
                      ),
                      onClick: () =>
                        router.replace({
                          query: {
                            ...router.query,
                            currentTab: TabEnum.import,
                            source: ImportDataSourceEnum.externalFile
                          }
                        })
                    }
                  ]
                }
              ]}
            />
          )}
        </>
      )}

      {/* modal */}
      {!!editFolderData && (
        <EditFolderModal
          onClose={() => setEditFolderData(undefined)}
          editCallback={async (name) => {
            try {
              if (editFolderData.id) {
                await putDatasetCollectionById({
                  id: editFolderData.id,
                  name
                });
                getData(pageNum);
              } else {
                onCreateCollection({
                  name,
                  type: DatasetCollectionTypeEnum.folder
                });
              }
            } catch (error) {
              return Promise.reject(error);
            }
          }}
          isEdit={!!editFolderData.id}
          name={editFolderData.name}
        />
      )}
      <EditCreateVirtualFileModal iconSrc={'modal/manualDataset'} closeBtnText={''} />
      {isOpenFileSourceSelector && <FileSourceSelector onClose={onCloseFileSourceSelector} />}
      <ConfirmBatchDeleteModal />
      <ConfirmBatchEmModal />
    </Flex>
  );
};

export default Header;
