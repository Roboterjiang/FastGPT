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
import { postCreateConfigTag, getConfigTagListByUid } from '@/web/core/tag/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { TagItemType } from '@fastgpt/global/core/config/type';

const TagInfo: React.FC = () => {
  const [tags, setTags] = useState<TagItemType[]>([]);
  const [isTagModalOpen, setTagModalOpen] = useState(false);
  const [isEditTag, setIsEditTag] = useState(false);
  const [currentTagId, setCurrentTagId] = useState<string | undefined>('');
  const {
    handleSubmit: handleTagSubmit,
    register: registerTag,
    formState: { errors: tagErrors },
    reset: resetTag
  } = useForm<TagItemType>();
  const { toast } = useToast();

  const { listLoading, refresh } = useRequest2(
    async () => {
      const result = await getConfigTagListByUid('');
      setTags(result || []);
    },
    {
      manual: true,
      onSuccess() {},
      onError(e: any) {
        console.log(e);
      },
      onFinally() {}
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

  const { mutate: onclickCreate, isLoading: creating } = useRequest({
    mutationFn: async (data: CreateTagParams) => {
      let id = await postCreateConfigTag(data);
      return { id, tagKey: data.tagKey, tagValue: data.tagValue };
    },
    successToast: '新增成功',
    errorToast: '新增失败',
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
        title: '标签值不可以重复',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    onclickCreate({ tagKey, tagValue });
  };

  const editTag: SubmitHandler<TagItemType> = ({ tagKey, tagValue }) => {
    if (currentTagId === null) return;
    setTags(tags.map((tag) => (tag._id === currentTagId ? { ...tag, tagKey, tagValue } : tag)));
    closeTagModal();
  };

  const removeTag = (tagId: string | undefined) => {
    setTags(tags.filter((tag) => tag._id !== tagId));
  };

  return (
    <Box p={8}>
      <VStack spacing={5} align="stretch">
        <Flex alignItems={'center'}>
          <Box flex={1}>标签</Box>
          <Button
            ml={4}
            _hover={{
              color: 'primary.200'
            }}
            fontSize={['sm', 'md']}
            onClick={() => openTagModal(false, '')}
          >
            <AddIcon mr={2} />
            <Box>新建标签</Box>
          </Button>
        </Flex>
        <Table variant="simple" mt={5}>
          <Thead>
            <Tr>
              <Th>标签键</Th>
              <Th>标签值</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tags.map((tag) => (
              <Tr key={tag._id}>
                <Td>{tag.tagKey}</Td>
                <Td>{tag.tagValue}</Td>
                <Td>
                  <IconButton
                    aria-label="Edit tag"
                    icon={<EditIcon />}
                    size="sm"
                    onClick={() => openTagModal(true, tag._id)}
                  />
                  <IconButton
                    ml={2}
                    aria-label="Delete tag"
                    icon={<DeleteIcon />}
                    size="sm"
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
          <ModalHeader>{isEditTag ? '编辑标签' : '新增标签'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleTagSubmit(isEditTag ? editTag : addTag)}>
              <FormControl isInvalid={!!tagErrors.tagKey}>
                <FormLabel>标签键</FormLabel>
                <Input
                  placeholder="请输入标签键"
                  {...registerTag('tagKey', { required: '请输入标签键' })}
                />
                <FormErrorMessage>{tagErrors.tagKey && tagErrors.tagKey.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!tagErrors.tagValue} mt={4}>
                <FormLabel>标签值</FormLabel>
                <Input
                  placeholder="请输入标签值"
                  {...registerTag('tagValue', { required: '请输入标签值' })}
                />
                <FormErrorMessage>
                  {tagErrors.tagValue && tagErrors.tagValue.message}
                </FormErrorMessage>
              </FormControl>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              isLoading={creating}
              onClick={handleTagSubmit(isEditTag ? editTag : addTag)}
            >
              确定
            </Button>
            <Button variant="ghost" onClick={closeTagModal}>
              取消
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TagInfo;
