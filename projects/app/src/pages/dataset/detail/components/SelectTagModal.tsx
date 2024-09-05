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
  Spinner
} from '@chakra-ui/react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import Select from 'react-select';
import { getConfigTagListByUid } from '@/web/core/tag/api';
import { TagItemType, FormTagValues } from '@fastgpt/global/core/tag/type';
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation();

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={'16px'}>{t('tag.Select tag')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Spinner />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* <FormControl isInvalid={!!errors.key}>
                <FormLabel>标签键</FormLabel>
                <Controller
                  name="key"
                  control={control}
                  rules={{ required: '请选择标签键' }}
                  render={({ field }) => (
                    <Select
                      options={tagKeys}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption?.value || '');
                        //切换标签键时，清空标签值
                      }}
                      isClearable
                      isSearchable
                      placeholder="请选择标签键"
                      theme={customTheme}
                    />
                  )}
                />
                <FormErrorMessage>{errors.key && errors.key.message}</FormErrorMessage>
              </FormControl> */}

              <FormControl isInvalid={!!errors.values} mt={4}>
                {/* <FormLabel>标签值</FormLabel> */}
                <Controller
                  name="values"
                  control={control}
                  //   rules={{ required: '请选择标签' }}
                  render={({ field }) => (
                    <Select
                      defaultValue={selectTags?.map((tag) => ({
                        value: tag.tagValue,
                        label: tag.tagValue
                      }))}
                      options={tags.map((tag) => ({ value: tag.tagValue, label: tag.tagValue }))}
                      isMulti
                      onChange={(selectedOptions) =>
                        field.onChange(
                          selectedOptions.map((x) => {
                            return { tagKey: x.value, tagValue: x.label };
                          })
                        )
                      }
                      placeholder={t('tag.Please select tag')}
                      theme={customTheme}
                    />
                  )}
                />
                <FormErrorMessage>{errors.values && errors.values.message}</FormErrorMessage>
              </FormControl>
            </form>
          )}
        </ModalBody>
        <ModalFooter mt={'20px'} display={'unset'} textAlign={'center'}>
          <Button
              borderRadius={'5px'}
              border={'1px'}
              borderColor={'primary.10'}
              bg={''}
              mr={4}
              color={'primary.10'}
              onClick={handleClose}
          >
            {t('common.Cancel')}
          </Button>
          <Button mr={3} onClick={handleFormSubmit}>
            {t('common.Confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SelectTagModal;
