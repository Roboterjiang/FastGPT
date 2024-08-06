import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  Flex,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  MenuButton,
  Checkbox,
  HStack,
  Tag,
  useDisclosure
} from '@chakra-ui/react';
import {
  delDatasetCollectionById,
  putDatasetCollectionById,
  postLinkCollectionSync,
  delAdDatasetDocs,
  vectorizeAdDatasetsDocs
} from '@/web/core/dataset/api';
import { useQuery } from '@tanstack/react-query';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import dayjs from 'dayjs';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { useRouter } from 'next/router';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useEditTitle } from '@/web/common/hooks/useEditTitle';
import {
  DatasetCollectionTypeEnum,
  DatasetStatusEnum,
  DatasetCollectionSyncResultMap
} from '@fastgpt/global/core/dataset/constants';
import { getCollectionIcon } from '@fastgpt/global/core/dataset/utils';
import { TabEnum } from '../../index';
import dynamic from 'next/dynamic';
import { useDrag } from '@/web/common/hooks/useDrag';
import SelectCollections from '@/web/core/dataset/components/SelectCollections';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { DatasetCollectionSyncResultEnum } from '@fastgpt/global/core/dataset/constants';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useContextSelector } from 'use-context-selector';
import { CollectionPageContext } from './Context';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';
import { useUserStore } from '@/web/support/user/useUserStore';

import { useForm, Controller } from 'react-hook-form';
import { DatasetCollectionsListItemType } from '@/global/core/dataset/type';
import { FormTagValues, TagItemType } from '@fastgpt/global/core/tag/type';
import { ImportSourceItemType } from '@/web/core/dataset/type';

const Header = dynamic(() => import('./Header'));
const EmptyCollectionTip = dynamic(() => import('./EmptyCollectionTip'));
const SelectTagModal = dynamic(() => import('../SelectTagModal'));

interface SelectedItemProps {
  selectedItems: string[];
}

const CollectionCard = () => {
  const BoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { datasetDetail, loadDatasetDetail } = useContextSelector(DatasetPageContext, (v) => v);
  const [currentCollection, setCurrentCollection] = useState<DatasetCollectionsListItemType>();

  const { openConfirm: openDeleteConfirm, ConfirmModal: ConfirmDeleteModal } = useConfirm({
    content: t('dataset.Confirm to delete the file'),
    type: 'delete'
  });
  const { openConfirm: openSyncConfirm, ConfirmModal: ConfirmSyncModal } = useConfirm({
    content: t('core.dataset.collection.Start Sync Tip')
  });
  //重新向量化弹框
  const { openConfirm: openEmConfirm, ConfirmModal: ConfirmEmdModal } = useConfirm({
    content: '确定重新建立索引？'
  });

  const { onOpenModal: onOpenEditTitleModal, EditModal: EditTitleModal } = useEditTitle({
    title: t('Rename')
  });

  const {
    isOpen: isOpenTagModal,
    onOpen: onOpenTagModal,
    onClose: onCloseTagModal
  } = useDisclosure();

  const [moveCollectionData, setMoveCollectionData] = useState<{ collectionId: string }>();

  const { collections, Pagination, total, getData, isGetting, pageNum, pageSize } =
    useContextSelector(CollectionPageContext, (v) => v);

  const { dragStartId, setDragStartId, dragTargetId, setDragTargetId } = useDrag();

  // Ad file status icon
  const formatCollections = useMemo(
    () =>
      collections.map((collection) => {
        const icon = getCollectionIcon(collection.type, collection.name);
        const status = (() => {
          //   if (collection.trainingAmount > 0) {
          if (collection.status == 1) {
            return {
              //   statusText: t('dataset.collections.Collection Embedding', {
              //     total: collection.trainingAmount
              //   }),
              statusText: '索引中',
              color: 'myGray.600',
              bg: 'myGray.50',
              borderColor: 'borderColor.low'
            };
          } else if (collection.status == 3) {
            return {
              statusText: '索引失败',
              color: 'red.600',
              bg: 'red.50',
              borderColor: 'red.300'
            };
          }
          return {
            statusText: t('core.dataset.collection.status.active'),
            color: 'green.600',
            bg: 'green.50',
            borderColor: 'green.300'
          };
        })();

        return {
          ...collection,
          icon,
          ...status
        };
      }),
    [collections, t]
  );

  const { mutate: onUpdateCollectionTag } = useRequest({
    mutationFn: ({ collectionId, tagInfo }: { collectionId: string; tagInfo: TagItemType[] }) => {
      return putDatasetCollectionById({
        id: collectionId,
        tagInfo
      });
    },
    onSuccess() {
      getData(pageNum);
    },

    successToast: '标签设置成功',
    errorToast: '标签设置失败'
  });
  const { mutate: onDelCollection, isLoading: isDeleting } = useRequest({
    mutationFn: (collectionId: string) => {
      return delDatasetCollectionById({
        id: collectionId
      });
    },
    onSuccess() {
      getData(pageNum);
    },
    successToast: t('common.Delete Success'),
    errorToast: t('common.Delete Failed')
  });

  const { mutate: onclickStartSync, isLoading: isSyncing } = useRequest({
    mutationFn: (collectionId: string) => {
      return postLinkCollectionSync(collectionId);
    },
    onSuccess(res: DatasetCollectionSyncResultEnum) {
      getData(pageNum);
      toast({
        status: 'success',
        title: t(DatasetCollectionSyncResultMap[res]?.label)
      });
    },
    errorToast: t('core.dataset.error.Start Sync Failed')
  });

  const hasTrainingData = useMemo(
    () => !!formatCollections.find((item) => item.trainingAmount > 0),
    [formatCollections]
  );
  const isLoading = useMemo(
    () => isDeleting || isSyncing || (isGetting && collections.length === 0),
    [collections.length, isDeleting, isGetting, isSyncing]
  );

  useQuery(
    ['refreshCollection'],
    () => {
      getData(1);
      if (datasetDetail.status === DatasetStatusEnum.syncing) {
        loadDatasetDetail(datasetDetail._id);
      }
      return null;
    },
    {
      refetchInterval: 6000,
      enabled: hasTrainingData || datasetDetail.status === DatasetStatusEnum.syncing
    }
  );

  const { handleSubmit, control, getValues, setValue, watch } = useForm<SelectedItemProps>({
    defaultValues: {
      selectedItems: []
    }
  });

  const selectedItems = watch('selectedItems');

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setValue(
        'selectedItems',
        formatCollections.map((item) => item._id)
      );
    } else {
      setValue('selectedItems', []);
    }
  };

  const getTagInfo = (collection: DatasetCollectionsListItemType) => {
    return (
      <HStack spacing={2}>
        {collection.tagInfo?.map((tag, index) => (
          <Tag key={index} variant="solid" colorScheme="primary" borderRadius="full">
            {tag.tagValue}
          </Tag>
        ))}
      </HStack>
    );
  };

  const onSubmit = (result: FormTagValues) => {
    if (currentCollection) {
      //更新数据库中的tagInfo  updateDatasetCollectionTagInfo
      onUpdateCollectionTag({
        collectionId: currentCollection._id,
        tagInfo: result.values
      });
    }
  };

  return (
    <MyBox isLoading={isLoading} h={'100%'} py={[2, 4]}>
      <Flex ref={BoxRef} flexDirection={'column'} py={[1, 3]} h={'100%'}>
        {/* header */}
        <Header />

        {/* collection table */}
        <TableContainer
          px={[2, 6]}
          mt={[0, 3]}
          position={'relative'}
          flex={'1 0 0'}
          overflowY={'auto'}
          fontSize={'sm'}
        >
          <Table variant={'simple'} draggable={false}>
            <Thead draggable={false}>
              <Tr>
                <Th py={4}>
                  <Checkbox
                    isChecked={
                      formatCollections.length > 0 &&
                      selectedItems.length === formatCollections.length
                    }
                    isIndeterminate={
                      selectedItems.length > 0 && selectedItems.length < formatCollections.length
                    }
                    onChange={handleSelectAll}
                  />
                </Th>
                <Th py={4}>#</Th>
                <Th py={4}>{t('common.Name')}</Th>
                <Th py={4}>标签</Th>
                <Th py={4}>{t('core.dataset.Sync Time')}</Th>
                <Th py={4}>{t('common.Status')}</Th>
                <Th py={4} />
              </Tr>
            </Thead>
            <Tbody>
              <Tr h={'10px'} />
              {formatCollections.map((collection, index) => (
                <Tr
                  key={collection._id}
                  _hover={{ bg: 'myGray.50' }}
                  cursor={'pointer'}
                  data-drag-id={
                    collection.type === DatasetCollectionTypeEnum.folder
                      ? collection._id
                      : undefined
                  }
                  bg={dragTargetId === collection._id ? 'primary.100' : ''}
                  userSelect={'none'}
                  onDragStart={() => {
                    setDragStartId(collection._id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    const targetId = e.currentTarget.getAttribute('data-drag-id');
                    if (!targetId) return;
                    DatasetCollectionTypeEnum.folder && setDragTargetId(targetId);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragTargetId(undefined);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (!dragTargetId || !dragStartId || dragTargetId === dragStartId) return;
                    // update parentId
                    try {
                      await putDatasetCollectionById({
                        id: dragStartId,
                        parentId: dragTargetId
                      });
                      getData(pageNum);
                    } catch (error) {}
                    setDragTargetId(undefined);
                  }}
                >
                  <Td>
                    <Controller
                      name="selectedItems"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          isChecked={field.value.includes(collection._id)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...field.value, collection._id]
                              : (field.value as string[]).filter(
                                  (id: string) => id !== collection._id
                                );
                            setValue('selectedItems', newValue);
                          }}
                        />
                      )}
                    />
                  </Td>
                  <Td w={'50px'}>{index + 1}</Td>
                  <Td minW={'150px'} maxW={['200px', '300px']} draggable>
                    <Flex alignItems={'center'}>
                      <MyIcon name={collection.icon as any} w={'16px'} mr={2} />
                      <MyTooltip label={t('common.folder.Drag Tip')} shouldWrapChildren={false}>
                        <Box color={'myGray.900'} className="textEllipsis">
                          {collection.name}
                        </Box>
                      </MyTooltip>
                    </Flex>
                  </Td>
                  <Td>{getTagInfo(collection)}</Td>
                  <Td>{dayjs(collection.updateTime).format('YYYY/MM/DD HH:mm')}</Td>
                  <Td>
                    <Box
                      display={'inline-flex'}
                      alignItems={'center'}
                      w={'auto'}
                      color={collection.color}
                      bg={collection.bg}
                      borderWidth={'1px'}
                      borderColor={collection.borderColor}
                      px={3}
                      py={1}
                      borderRadius={'md'}
                      _before={{
                        content: '""',
                        w: '6px',
                        h: '6px',
                        mr: 2,
                        borderRadius: 'lg',
                        bg: collection.color
                      }}
                    >
                      {t(collection.statusText)}
                    </Box>
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    {collection.permission.hasWritePer && (
                      <MyMenu
                        width={100}
                        offset={[-70, 5]}
                        Button={
                          <MenuButton
                            w={'22px'}
                            h={'22px'}
                            borderRadius={'md'}
                            _hover={{
                              color: 'primary.500',
                              '& .icon': {
                                bg: 'myGray.200'
                              }
                            }}
                          >
                            <MyIcon
                              className="icon"
                              name={'more'}
                              h={'16px'}
                              w={'16px'}
                              px={1}
                              py={1}
                              borderRadius={'md'}
                              cursor={'pointer'}
                            />
                          </MenuButton>
                        }
                        menuList={[
                          {
                            children: [
                              ...(collection.type === DatasetCollectionTypeEnum.link
                                ? [
                                    {
                                      label: (
                                        <Flex alignItems={'center'}>
                                          <MyIcon name={'common/refreshLight'} w={'14px'} mr={2} />
                                          {t('core.dataset.collection.Sync')}
                                        </Flex>
                                      ),
                                      onClick: () =>
                                        openSyncConfirm(() => {
                                          onclickStartSync(collection._id);
                                        })()
                                    }
                                  ]
                                : [])
                            ]
                          },
                          {
                            children: [
                              //索引进行中不可删除
                              ...(collection.status != 1
                                ? [
                                    {
                                      label: (
                                        <Flex alignItems={'center'}>
                                          <MyIcon
                                            mr={1}
                                            name={'common/refreshLight'}
                                            w={'14px'}
                                            _hover={{ color: 'red.600' }}
                                          />
                                          <Box>{'重新索引'}</Box>
                                        </Flex>
                                      ),
                                      type: 'primary',
                                      onClick: () =>
                                        openEmConfirm(
                                          async () => {
                                            const result = await vectorizeAdDatasetsDocs(
                                              userInfo._id,
                                              router.query.kb_id,
                                              collection.adFileId
                                            );
                                            if (result && result.status == 'success') {
                                              toast({
                                                status: 'success',
                                                title: '重新索引请求发送成功'
                                              });
                                            }
                                          },
                                          undefined,
                                          ''
                                        )()
                                    }
                                  ]
                                : [])
                            ]
                          },
                          {
                            children: [
                              {
                                label: (
                                  <Flex alignItems={'center'}>
                                    <MyIcon
                                      mr={1}
                                      name={'core/tag/tagFill'}
                                      w={'14px'}
                                      _hover={{ color: 'red.600' }}
                                    />
                                    <Box>设置标签</Box>
                                  </Flex>
                                ),
                                type: 'primary',
                                onClick: () => {
                                  onOpenTagModal();
                                  setCurrentCollection(collection);
                                }
                              }
                            ]
                          },
                          {
                            children: [
                              ...(collection.status != 1
                                ? [
                                    {
                                      label: (
                                        <Flex alignItems={'center'}>
                                          <MyIcon
                                            mr={1}
                                            name={'delete'}
                                            w={'14px'}
                                            _hover={{ color: 'red.600' }}
                                          />
                                          <Box>{t('common.Delete')}</Box>
                                        </Flex>
                                      ),
                                      type: 'danger',
                                      onClick: () =>
                                        openDeleteConfirm(
                                          async () => {
                                            const result = await delAdDatasetDocs(
                                              userInfo._id,
                                              router.query.kb_id,
                                              collection.adFileId
                                            );
                                            if (result && result.status == 'success') {
                                              onDelCollection(collection._id);
                                            } else {
                                              toast({
                                                status: 'error',
                                                title: result.message ? result.message : '删除失败'
                                              });
                                            }
                                          },
                                          undefined,
                                          collection.type === DatasetCollectionTypeEnum.folder
                                            ? t('dataset.collections.Confirm to delete the folder')
                                            : t('dataset.Confirm to delete the file')
                                        )()
                                    }
                                  ]
                                : [])
                            ]
                          }
                        ]}
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {total > pageSize && (
            <Flex mt={2} justifyContent={'center'}>
              <Pagination />
            </Flex>
          )}
          {total === 0 && <EmptyCollectionTip />}
        </TableContainer>

        <ConfirmDeleteModal />
        <ConfirmSyncModal />
        <EditTitleModal />
        <ConfirmEmdModal />
        {isOpenTagModal && (
          <SelectTagModal
            onClose={onCloseTagModal}
            isOpen={isOpenTagModal}
            onSubmit={onSubmit}
            selectTags={currentCollection?.tagInfo}
          />
        )}

        {!!moveCollectionData && (
          <SelectCollections
            datasetId={datasetDetail._id}
            type="folder"
            defaultSelectedId={[moveCollectionData.collectionId]}
            onClose={() => setMoveCollectionData(undefined)}
            onSuccess={async ({ parentId }) => {
              await putDatasetCollectionById({
                id: moveCollectionData.collectionId,
                parentId
              });
              getData(pageNum);
              setMoveCollectionData(undefined);
              toast({
                status: 'success',
                title: t('common.folder.Move Success')
              });
            }}
          />
        )}
      </Flex>
    </MyBox>
  );
};

export default React.memo(CollectionCard);
