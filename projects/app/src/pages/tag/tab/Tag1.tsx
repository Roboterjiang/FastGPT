// App.tsx
import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  HStack,
  Input,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import Select from 'react-select';

interface TagValue {
  id: number;
  value: string;
  updatedAt: Date;
}

interface TagItem {
  id: number;
  key: string;
  values: TagValue[];
}

interface TagFormValues {
  key: string;
  values: string[];
}

const App: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isTagModalOpen, setTagModalOpen] = useState(false);
  const [isEditTag, setIsEditTag] = useState(false);
  const [currentTagId, setCurrentTagId] = useState<number | null>(null);
  const [currentTagKey, setCurrentTagKey] = useState<string | null>(null);
  const {
    handleSubmit: handleTagSubmit,
    register: registerTag,
    formState: { errors: tagErrors },
    reset: resetTag,
    setValue,
    watch
  } = useForm<TagFormValues>();
  const toast = useToast();

  const tagKeys = tags.map((tag) => ({ value: tag.key, label: tag.key }));

  const openTagModal = (
    isEdit: boolean,
    tagId: number | null = null,
    tagKey: string | null = null
  ) => {
    setIsEditTag(isEdit);
    setCurrentTagId(tagId);
    setCurrentTagKey(tagKey);
    setTagModalOpen(true);
  };

  const closeTagModal = () => {
    resetTag();
    setTagModalOpen(false);
  };

  const addTag: SubmitHandler<TagFormValues> = ({ key, values }) => {
    const existingTag = tags.find((tag) => tag.key === key);
    if (existingTag) {
      const newValues = values.filter(
        (value) => !existingTag.values.some((tagValue) => tagValue.value === value)
      );
      if (newValues.length === 0) {
        toast({
          title: 'All tag values already exist for this key',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      const updatedTag = {
        ...existingTag,
        values: [
          ...existingTag.values,
          ...newValues.map((value) => ({ id: Date.now(), value, updatedAt: new Date() }))
        ]
      };
      setTags(tags.map((tag) => (tag.id === existingTag.id ? updatedTag : tag)));
    } else {
      setTags([
        ...tags,
        {
          id: Date.now(),
          key,
          values: values.map((value) => ({ id: Date.now(), value, updatedAt: new Date() }))
        }
      ]);
    }
    closeTagModal();
  };

  const editTag: SubmitHandler<TagFormValues> = ({ key, values }) => {
    if (currentTagId === null || currentTagKey === null) return;
    const tag = tags.find((tag) => tag.id === currentTagId);
    if (tag) {
      const updatedTag = {
        ...tag,
        key,
        values: values.map((value) => ({
          id: Date.now(),
          value,
          updatedAt: new Date()
        }))
      };
      setTags(tags.map((t) => (t.id === currentTagId ? updatedTag : t)));
    }
    closeTagModal();
  };

  const removeTagValue = (tagId: number, valueId: number) => {
    const tag = tags.find((tag) => tag.id === tagId);
    if (tag) {
      const updatedTag = {
        ...tag,
        values: tag.values.filter((tagValue) => tagValue.id !== valueId)
      };
      setTags(tags.map((t) => (t.id === tagId ? updatedTag : t)));
    }
  };

  const handleAddValue = (value: string) => {
    const currentValues = watch('values') || [];
    setValue('values', [...currentValues, value]);
  };

  const handleRemoveValue = (value: string) => {
    const currentValues = watch('values') || [];
    setValue(
      'values',
      currentValues.filter((v) => v !== value)
    );
  };

  return (
    <ChakraProvider>
      <Box p={5}>
        <VStack spacing={5} align="stretch">
          <Button colorScheme="blue" onClick={() => openTagModal(false)}>
            Add Tag
          </Button>

          <Table variant="simple" mt={5}>
            <Thead>
              <Tr>
                <Th>Key</Th>
                <Th>Value</Th>
                <Th>Updated At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tags.map((tag) =>
                tag.values.map((tagValue) => (
                  <Tr key={tagValue.id}>
                    <Td>{tag.key}</Td>
                    <Td>{tagValue.value}</Td>
                    <Td>{tagValue.updatedAt.toLocaleString()}</Td>
                    <Td>
                      <IconButton
                        aria-label="Edit tag"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => openTagModal(true, tag.id, tagValue.value)}
                      />
                      <IconButton
                        aria-label="Delete tag"
                        icon={<DeleteIcon />}
                        size="sm"
                        onClick={() => removeTagValue(tag.id, tagValue.id)}
                      />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </VStack>

        {/* Tag Modal */}
        <Modal isOpen={isTagModalOpen} onClose={closeTagModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{isEditTag ? 'Edit Tag' : 'Add Tag'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <form onSubmit={handleTagSubmit(isEditTag ? editTag : addTag)}>
                <FormControl isInvalid={!!tagErrors.key}>
                  <FormLabel>Key</FormLabel>
                  <Select
                    options={tagKeys}
                    onChange={(selectedOption) => setValue('key', selectedOption?.value || '')}
                    isClearable
                    isSearchable
                    placeholder="Enter or select key"
                  />
                  <Input
                    placeholder="Enter key"
                    {...registerTag('key', { required: 'Key is required' })}
                    defaultValue={currentTagKey || ''}
                    isReadOnly={isEditTag}
                    mt={2}
                  />
                  <FormErrorMessage>{tagErrors.key && tagErrors.key.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!tagErrors.values} mt={4}>
                  <FormLabel>Values</FormLabel>
                  <HStack>
                    <Input
                      placeholder="Enter value"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          e.preventDefault();
                          handleAddValue(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </HStack>
                  <HStack wrap="wrap" mt={2}>
                    {watch('values')?.map((value, idx) => (
                      <Tag
                        key={idx}
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="blue"
                        mr={1}
                        mt={1}
                      >
                        <TagLabel>{value}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveValue(value)} />
                      </Tag>
                    ))}
                  </HStack>
                  <FormErrorMessage>
                    {tagErrors.values && tagErrors.values.message}
                  </FormErrorMessage>
                </FormControl>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={handleTagSubmit(isEditTag ? editTag : addTag)}
              >
                {isEditTag ? 'Edit' : 'Add'}
              </Button>
              <Button variant="ghost" onClick={closeTagModal}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ChakraProvider>
  );
};

export default App;
