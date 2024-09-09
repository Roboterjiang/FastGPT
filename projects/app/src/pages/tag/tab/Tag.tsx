// App.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { CreateTagParams } from '@/global/core/tag/api';
import {
  postCreateConfigTag,
  getConfigTagListByUid,
  putConfigTagById,
  delConfigTagById
} from '@/web/core/tag/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { TagItemType } from '@fastgpt/global/core/tag/type';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { getTableBgColor } from '@fastgpt/global/common/table/tools';


import MyBox from '@fastgpt/web/components/common/MyBox';
import { useTranslation } from 'next-i18next';
import MyIcon from "@fastgpt/web/components/common/Icon";

const TagInfo: React.FC = () => {
  const { t } = useTranslation();
  const [tags, setTags] = useState<TagItemType[]>([]);
  const [isTagModalOpen, setTagModalOpen] = useState(false);
  const [isEditTag, setIsEditTag] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [currentTagId, setCurrentTagId] = useState<string | undefined>('');
  const {
    handleSubmit: handleTagSubmit,
    register: registerTag,
    formState: { errors: tagErrors },
    reset: resetTag
  } = useForm<TagItemType>();
  const { toast } = useToast();

  const { refresh } = useRequest2(
    async () => {
      setListLoading(true);
      const result = await getConfigTagListByUid('');
      setTags(result || []);
    },
    {
      manual: true,
      onSuccess() {},
      onError(e: any) {
        console.log(e);
      },
      onFinally() {
        setListLoading(false);
      }
    }
  );

  useEffect(() => {
    //手动触发刷新
    refresh();
  }, []);

  const openTagModal = (isEdit: boolean, tagId: string | undefined) => {
    setIsEditTag(isEdit);
    setCurrentTagId(tagId);
    setTagModalOpen(true);
  };

  const closeTagModal = () => {
    resetTag();
    setTagModalOpen(false);
  };

  const { mutate: onAddTag, isLoading: creating } = useRequest({
    mutationFn: async (data: CreateTagParams) => {
      let id = await postCreateConfigTag(data);
      return { id, tagKey: data.tagKey, tagValue: data.tagValue };
    },
    successToast: t('tag.Added successfully'),
    errorToast: t('tag.Addition failed'),
    onSuccess(result: TagItemType) {
      setTags([...tags, result]);
      resetTag();
      closeTagModal();
      refresh();
    }
  });

  const { mutate: onEditTag, isLoading: editLoading } = useRequest({
    mutationFn: async (data: CreateTagParams) => {
      let result = await putConfigTagById(data);
      return result;
    },
    successToast: t('tag.Added successfully'),
    errorToast: t('tag.Addition failed'),
    onSuccess(result: TagItemType) {
      setTags([...tags, result]);
      resetTag();
      closeTagModal();
      refresh();
    }
  });

  //tagKey可以重复
  const addTag: SubmitHandler<TagItemType> = ({ tagKey, tagValue }) => {
    if (tags.some((tag) => tag.tagValue === tagValue)) {
      toast({
        title: t('tag.Tag values cannot be duplicated'),
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    onAddTag({ tagKey, tagValue });
  };

  const editTag: SubmitHandler<TagItemType> = (data) => {
    if (currentTagId === null) return;
    onEditTag({ _id: currentTagId, ...data });
  };

  const { openConfirm, ConfirmModal } = useConfirm({
    type: 'delete'
  });

  const removeTag = (_id: string) => {
    openConfirm(
      () =>
        new Promise<void>((resolve) => {
          delConfigTagById(_id)
            .then((res) => {
              refresh();
              resolve();
            })
            .catch(() => {
              toast({
                status: 'error',
                title: t('tag.Deletion failed, please try again')
              });
            });
        }),
      undefined,
      t('tag.Delete tag')
    )();
  };

  return (
    <MyBox isLoading={listLoading}>
      <Box p={4} pb={0} display={'flex'} alignItems={'center'} fontSize={'16px'} fontWeight={'600'}>
        <Box mr={2} w={'4px'} h={'16px'} backgroundColor={'primary.10'}></Box>
        <Box>{t('navbar.Tag')}</Box>
      </Box>
      <VStack pl={5} pr={5} spacing={5} align="stretch">
        <Flex justifyContent={'flex-end'}>
          <Button
            ml={4}
            _hover={{
              color: 'primary.200'
            }}
            w={'160px'}
            h={'40px'}
            fontSize={['sm', 'md']}
            onClick={() => openTagModal(false, '')}
          >
            <AddIcon mr={2} />
            <Box>{t('tag.Create new tag')}</Box>
          </Button>
        </Flex>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t('tag.Tag key')}</Th>
              <Th>{t('tag.Tag value')}</Th>
              <Th>{t('common.Action')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tags.map((tag,index) => (
              <Tr key={tag._id} bg={getTableBgColor(index,false)}>
                <Td>{tag.tagKey}</Td>
                <Td>{tag.tagValue}</Td>
                <Td>
                  {/*<IconButton*/}
                  {/*  aria-label="Edit tag"*/}
                  {/*  icon={<EditIcon />}*/}
                  {/*  size="sm"*/}
                  {/*  onClick={() => openTagModal(true, tag._id)}*/}
                  {/*/>*/}
                  <Button
                    _hover={{ bg: 'primary.60' }}
                    onClick={() => openTagModal(true, tag._id)}
                    borderRadius={'4px'}
                    bg={'primary.60'}
                    border={'none'}
                    width={'80px'}
                    color={'primary.600'}
                    variant="outline"
                  >
                    {t('common.Edit')}
                  </Button>
                  <IconButton
                    ml={6}
                    icon={<MyIcon name={'delete'} w={'18px'} p={2} />}
                    size="sm"
                    bg={'none'}
                    border={'none'}
                    color={'red.600'}
                    boxShadow={'0'}
                    onClick={() => removeTag(tag._id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>

      {/* Tag Modal */}
      <Modal isOpen={isTagModalOpen} onClose={closeTagModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={'16px'}>
            {isEditTag ? t('tag.Edit tag') : t('tag.Create new tag')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleTagSubmit(isEditTag ? editTag : addTag)}>
              <FormControl isInvalid={!!tagErrors.tagKey}>
                <FormLabel>{t('tag.Tag key')}</FormLabel>
                <Input
                  bg={'myGray.22'}
                  maxLength={20}
                  _hover={{ borderColor: 'primary.500' }}
                  placeholder={t('tag.Please enter tag key')}
                  defaultValue={
                    currentTagId ? tags.find((tag) => tag._id === currentTagId)?.tagKey : ''
                  }
                  {...registerTag('tagKey', { required: t('tag.Please enter tag key') })}
                />
                <FormErrorMessage>{tagErrors.tagKey && tagErrors.tagKey.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!tagErrors.tagValue} mt={4}>
                <FormLabel>{t('tag.Tag value')}</FormLabel>
                <Input
                  bg={'myGray.22'}
                  maxLength={20}
                  _hover={{ borderColor: 'primary.500' }}
                  placeholder={t('tag.Please enter tag value')}
                  defaultValue={
                    currentTagId ? tags.find((tag) => tag._id === currentTagId)?.tagValue : ''
                  }
                  {...registerTag('tagValue', { required: t('tag.Please enter tag value') })}
                />
                <FormErrorMessage>
                  {tagErrors.tagValue && tagErrors.tagValue.message}
                </FormErrorMessage>
              </FormControl>
            </form>
          </ModalBody>
          <ModalFooter mt={5} display={'unset'} textAlign={'center'}>
            <Button
              borderRadius={'5px'}
              border={'1px'}
              borderColor={'primary.10'}
              bg={''}
              mr={4}
              color={'primary.10'}
              onClick={closeTagModal}
            >
              {t('common.Cancel')}
            </Button>
            <Button
              colorScheme="blue"
              borderRadius={'5px'}
              mr={3}
              isLoading={creating || editLoading}
              onClick={handleTagSubmit(isEditTag ? editTag : addTag)}
            >
              {t('common.Confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ConfirmModal />
    </MyBox>
  );
};

export default TagInfo;
