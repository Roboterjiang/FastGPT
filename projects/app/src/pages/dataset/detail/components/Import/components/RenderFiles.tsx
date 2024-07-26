import React, { useState } from 'react';
import {
  Flex,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Tbody,
  Progress,
  IconButton,
  HStack,
  useDisclosure
} from '@chakra-ui/react';
import { ImportSourceItemType } from '@/web/core/dataset/type.d';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import dynamic from 'next/dynamic';
import { useI18n } from '@/web/context/I18n';
import { SelectTagFormValues } from '@fastgpt/global/core/tag/type';

const PreviewRawText = dynamic(() => import('./PreviewRawText'));

const SelectTagModal = dynamic(() => import('../../SelectTagModal'));

export const RenderUploadFiles = ({
  files,
  setFiles,
  showPreviewContent
}: {
  files: ImportSourceItemType[];
  setFiles: React.Dispatch<React.SetStateAction<ImportSourceItemType[]>>;
  showPreviewContent?: boolean;
}) => {
  const { t } = useTranslation();
  const { fileT } = useI18n();
  const [previewFile, setPreviewFile] = useState<ImportSourceItemType>();
  const [tagFile, setTagFile] = useState<ImportSourceItemType>();

  const {
    isOpen: isOpenTagModal,
    onOpen: onOpenTagModal,
    onClose: onCloseTagModal
  } = useDisclosure();

  const onSubmit = (result: SelectTagFormValues) => {
    if (tagFile) {
      setFiles((state) =>
        state.map((file) => (file.id === tagFile.id ? { ...file, tagInfo: result } : file))
      );
    }
  };

  return files.length > 0 ? (
    <>
      <TableContainer mt={5}>
        <Table variant={'simple'} fontSize={'sm'} draggable={false}>
          <Thead draggable={false}>
            <Tr bg={'myGray.100'} mb={2}>
              <Th borderLeftRadius={'md'} borderBottom={'none'} py={4}>
                {fileT('File Name')}
              </Th>
              <Th borderLeftRadius={'md'} borderBottom={'none'} py={4}>
                标签
              </Th>
              <Th borderBottom={'none'} py={4}>
                {t('core.dataset.import.Upload file progress')}
              </Th>
              <Th borderBottom={'none'} py={4}>
                {fileT('File Size')}
              </Th>
              <Th borderRightRadius={'md'} borderBottom={'none'} py={4}>
                {t('common.Action')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {files.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <Flex alignItems={'center'}>
                    <MyIcon name={item.icon as any} w={'16px'} mr={1} />
                    {item.sourceName}
                  </Flex>
                </Td>
                <Td>
                  <Flex alignItems={'center'}>
                    <HStack spacing={2}>
                      {item.tagInfo?.values.map((tag, index) => (
                        <Tag key={index} variant="solid" colorScheme="primary" borderRadius="full">
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>
                  </Flex>
                </Td>
                <Td>
                  <Flex alignItems={'center'} fontSize={'xs'}>
                    <Progress
                      value={item.uploadedFileRate}
                      h={'6px'}
                      w={'100%'}
                      maxW={'210px'}
                      size="sm"
                      borderRadius={'20px'}
                      colorScheme={(item.uploadedFileRate || 0) >= 100 ? 'green' : 'blue'}
                      bg="myGray.200"
                      hasStripe
                      isAnimated
                      mr={2}
                    />
                    {`${item.uploadedFileRate}%`}
                  </Flex>
                </Td>
                <Td>{item.sourceSize}</Td>
                <Td>
                  {!item.isUploading && (
                    <Flex alignItems={'center'} gap={4}>
                      {/* {showPreviewContent && (
                        <MyTooltip label={t('core.dataset.import.Preview raw text')}>
                          <IconButton
                            variant={'whitePrimary'}
                            size={'sm'}
                            icon={<MyIcon name={'common/viewLight'} w={'18px'} />}
                            aria-label={''}
                            onClick={() => setPreviewFile(item)}
                          />
                        </MyTooltip>
                      )} */}

                      <IconButton
                        variant={'grayDanger'}
                        size={'sm'}
                        icon={<MyIcon name={'delete'} w={'14px'} />}
                        aria-label={''}
                        onClick={() => {
                          setFiles((state) => state.filter((file) => file.id !== item.id));
                        }}
                      />

                      <IconButton
                        variant={'grayDanger'}
                        size={'sm'}
                        icon={<MyIcon name={'tag'} w={'14px'} />}
                        aria-label={'标记'}
                        onClick={() => {
                          //弹框出现
                          onOpenTagModal();
                          setTagFile(item);
                        }}
                      />
                    </Flex>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {!!previewFile && (
        <PreviewRawText previewSource={previewFile} onClose={() => setPreviewFile(undefined)} />
      )}
      {isOpenTagModal && (
        <SelectTagModal onClose={onCloseTagModal} isOpen={isOpenTagModal} onSubmit={onSubmit} />
      )}
    </>
  ) : null;
};

export default RenderUploadFiles;
