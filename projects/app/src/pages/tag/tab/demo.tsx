import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Tag,
  TagLabel,
  TagCloseButton,
  FormControl,
  FormErrorMessage
} from '@chakra-ui/react';

import { useToast } from '@fastgpt/web/hooks/useToast';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { postCreateConfigTag } from '@/web/core/tag/api';
import { CreateTagParams } from '@/global/core/tag/api';

import { useUserStore } from '@/web/support/user/useUserStore';

interface TagItem {
  id: number;
  label: string;
}

interface FormValues {
  tag: string;
}

const TabTag = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset
  } = useForm<FormValues>();
  const { toast } = useToast();
  const { userInfo } = useUserStore();

  useEffect(() => {
    // 从网络加载标签数据
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data: TagItem[] = await response.json();
        setTags(data);
      } catch (error) {
        toast({
          title: '加载数据失败',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      } finally {
        // setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const { mutate: onclickCreate, isLoading: creating } = useRequest({
    mutationFn: async (data: CreateTagParams) => {
      let id = await postCreateConfigTag(data);
      return { id, name: data.name };
    },
    successToast: '新增成功',
    errorToast: '新增失败',
    onSuccess({ id, name }) {
      setTags([...tags, { id, label: name }]);
      reset();
    }
  });

  const addTag: SubmitHandler<FormValues> = ({ tag }) => {
    if (tags.some((t) => t.label === tag)) {
      toast({
        title: '标签已存在',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    }
    const user_id = userInfo?._id;
    onclickCreate({ user_id, name: tag });
    // setTags([...tags, { id: Date.now(), label: tag }]);
    // reset();
  };

  const removeTag = (id: number) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const updateTag = (id: number, newLabel: string) => {
    setTags(tags.map((tag) => (tag.id === id ? { ...tag, label: newLabel } : tag)));
  };

  return (
    <Box p={2}>
      <form onSubmit={handleSubmit(addTag)}>
        <VStack spacing={5} align="stretch">
          <FormControl isInvalid={!!errors.tag}>
            <HStack>
              <Input
                w={['100%', '500px']}
                placeholder="请输入标签名称"
                {...register('tag', { required: '请输入标签名称' })}
              />
              <Button colorScheme="blue" type="submit" isLoading={creating}>
                新增标签
              </Button>
            </HStack>
            <FormErrorMessage>{errors.tag && errors.tag.message}</FormErrorMessage>
          </FormControl>
          <HStack spacing={4} wrap="wrap">
            {tags.map((tag) => (
              <Tag size="lg" key={tag.id} borderRadius="full" variant="solid" colorScheme="blue">
                <TagLabel
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateTag(tag.id, e.currentTarget.textContent || '')}
                >
                  {tag.label}
                </TagLabel>
                <TagCloseButton onClick={() => removeTag(tag.id)} />
              </Tag>
            ))}
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

export default TabTag;
