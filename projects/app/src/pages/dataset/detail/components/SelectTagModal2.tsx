// SelectTagModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Spinner,
  Box,
  Select,
  Checkbox,
  CheckboxGroup,
  Heading,
  Stack
} from '@chakra-ui/react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { getConfigTagListByUid } from '@/web/core/tag/api';
import { TagItemType, FormTagValues } from '@fastgpt/global/core/tag/type';

interface SelectTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<FormTagValues>;
  selectTags: TagItemType[] | undefined;
}

const SelectTagModal: React.FC<SelectTagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectTags
}) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
    clearErrors,
    reset,
    setValue,
    resetField
  } = useForm<FormTagValues>();
  const [tags, setTags] = useState<TagItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // 模拟获取标签数据
      getConfigTagListByUid('').then((res) => {
        if (res) {
          //格式转换
          const tags: TagItemType[] = res;
          setTags(tags);
          setLoading(false);
        }
      });
    }
  }, []);

  //   const tagKeys = tags.map((tag) => ({ value: tag.key, label: tag.key }));
  //   const selectedKey = watch('key');
  //   const selectedTag = tags.find((tag) => tag.key === selectedKey);
  //   const tagValuesOptions = selectedTag
  //     ? selectedTag.values.map((item) => ({ value: item.tagValue, label: item.tagValue }))
  //     : [];
  // const tagValuesOptions = tags.map((tag) => ({ value: tag.tagValue, label: tag.tagValue }));

  const handleClose = () => {
    reset();
    onClose();
  };

  const customTheme = (theme: any) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary25: '#fbe3ef',
      primary: '#d30065'
    }
  });

  const handleFormSubmit = handleSubmit((data: FormTagValues) => {
    onSubmit(data);
    onClose();
  });

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedValues, setSelectedValues] = useState([]);

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setSelectedValues([]); // 清空子级选择
  };

  const handleValuesChange = (value) => {
    setSelectedValues(value);
  };

  // 原始数据
  const data = [
    { key: 'carrierType', values: ['车型', '车型1', '车型2'] },
    { key: 'test1', values: ['测试2'] },
    { key: 'doc_type', values: ['general', 'error_code'] },
    { key: 'test', values: ['123', 'fasdf', '345', '789', '678'] }
  ];

  const selectedGroupData = data.find((group) => group.key === selectedGroup);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>选择标签</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box p={4}>
            <Box mb={4}>
              <Heading size="md" mb={2}>
                选择分组
              </Heading>
              <Select placeholder="选择分组" onChange={handleGroupChange}>
                {data.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.key}
                  </option>
                ))}
              </Select>
            </Box>

            {selectedGroup && selectedGroupData && (
              <Box mb={4}>
                <Heading size="md" mb={2}>
                  {selectedGroupData.key} 选项
                </Heading>
                <CheckboxGroup
                  colorScheme="teal"
                  value={selectedValues}
                  onChange={handleValuesChange}
                >
                  <Stack>
                    {selectedGroupData.values.map((value) => (
                      <Checkbox key={value} value={value}>
                        {value}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </Box>
            )}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={handleFormSubmit}>
            确定
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            取消
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SelectTagModal;
