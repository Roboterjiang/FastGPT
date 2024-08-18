import MyBox from '@fastgpt/web/components/common/MyBox';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { Box, FlexProps } from '@chakra-ui/react';
import { formatFileSize } from '@fastgpt/global/common/file/tools';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import React, { DragEvent, useCallback, useMemo, useState } from 'react';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { getFileIcon } from '@fastgpt/global/common/file/icon';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { uploadFile2AidongDB, uploadFile2DB } from '@/web/common/file/controller';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import { ImportSourceItemType } from '@/web/core/dataset/type';
import { useI18n } from '@/web/context/I18n';
import { useUserStore } from '@/web/support/user/useUserStore';

import { getAdDatasetsDocs } from '@/web/core/dataset/api';

export type SelectFileItemType = {
  fileId: string;
  folderPath: string;
  file: File;
};

const FileSelector = ({
  fileType,
  selectFiles,
  datasetId,
  kb_id,
  doc_type,
  setSelectFiles,
  onStartSelect,
  onFinishSelect,
  isFileUploading,
  ...props
}: {
  fileType: string;
  selectFiles: ImportSourceItemType[];
  datasetId: string;
  kb_id: string;
  doc_type: string;
  setSelectFiles: React.Dispatch<React.SetStateAction<ImportSourceItemType[]>>;
  onStartSelect: () => void;
  onFinishSelect: () => void;
  isFileUploading: boolean;
} & FlexProps) => {
  const { t } = useTranslation();
  const { fileT } = useI18n();

  const { toast } = useToast();
  const { feConfigs } = useSystemStore();

  const maxCount = feConfigs?.uploadFileMaxAmount || 50;
  const maxSize = (feConfigs?.uploadFileMaxSize || 1024) * 1024 * 1024;

  const { userInfo } = useUserStore();

  const { File, onOpen } = useSelectFile({
    fileType,
    multiple: true,
    maxCount
  });
  const [isDragging, setIsDragging] = useState(false);

  const isMaxSelected = useMemo(
    () => selectFiles.length >= maxCount,
    [maxCount, selectFiles.length]
  );

  const filterTypeReg = new RegExp(
    `(${fileType
      .split(',')
      .map((item) => item.trim())
      .join('|')})$`,
    'i'
  );

  const { mutate: onSelectFile, isLoading } = useRequest({
    mutationFn: async (files: SelectFileItemType[]) => {
      {
        onStartSelect();
        setSelectFiles((state) => {
          const formatFiles = files.map<ImportSourceItemType>((selectFile) => {
            const { fileId, file } = selectFile;

            return {
              id: fileId,
              createStatus: 'waiting',
              file,
              sourceName: file.name,
              sourceSize: formatFileSize(file.size),
              icon: getFileIcon(file.name),
              isUploading: true,
              uploadedFileRate: 0
            };
          });
          const results = formatFiles.concat(state).slice(0, maxCount);
          return results;
        });

        let totalUploadFiles = 0;

        try {
          // upload file
          await Promise.all(
            files.map(async ({ fileId, file }) => {
              //   const uploadFileId = await uploadFile2DB({
              //     file,
              //     bucketName: BucketNameEnum.dataset,
              //     percentListen: (e) => {
              //       setSelectFiles((state) =>
              //         state.map((item) =>
              //           item.id === fileId
              //             ? {
              //                 ...item,
              //                 uploadedFileRate: e
              //               }
              //             : item
              //         )
              //       );
              //     }
              //   });
              const uploadInfo = await uploadFile2AidongDB({
                kb_id: kb_id,
                user_id: userInfo._id,
                file: file,
                doc_type: doc_type,
                percentListen: (e) => {
                  setSelectFiles((state) =>
                    state.map((item) =>
                      item.id === fileId
                        ? {
                            ...item,
                            uploadedFileRate: e
                          }
                        : item
                    )
                  );
                }
              });
              if (uploadInfo.data && uploadInfo.data.length > 0) {
                const serverFileId = uploadInfo.data[0].file_id;
                setSelectFiles((state) =>
                  state.map((item) =>
                    item.id === fileId
                      ? {
                          ...item,
                          dbFileId: serverFileId,
                          isUploading: false
                        }
                      : item
                  )
                );
                totalUploadFiles++;
              }
            })
          );
        } catch (error) {
          console.log(error);
        }
        if (totalUploadFiles == files.length) {
          //文件上传成功
          onFinishSelect();
        } else {
          toast({
            status: 'error',
            title: '文件上传失败，请删除文件重新上传'
          });
        }
      }
    }
  });

  const hasDuplicates = (files: any, serverNames: any) => {
    const fileNames = files.map((item: any) => item.file.name);
    const finalNames = fileNames.concat(serverNames);
    // console.log('爱动finalNames', finalNames);
    const uniqueNames = new Set(finalNames);
    return finalNames.length !== uniqueNames.size;
  };

  const selectFileCallback = useCallback(
    async (files: SelectFileItemType[]) => {
      const result = await getAdDatasetsDocs(userInfo._id, kb_id);
      if (result && result.data && result.data.length > 0) {
        let serverFilesNames = result.data.map((item: any) => item.file_name);
        //新增爱动判断，文件名不可以重复
        if (hasDuplicates(files, serverFilesNames)) {
          toast({
            status: 'warning',
            title: '知识库中所有的文件名都不可重复'
          });
          return;
        }
      }
      if (selectFiles.length + files.length > maxCount) {
        files = files.slice(0, maxCount - selectFiles.length);
        toast({
          status: 'warning',
          title: fileT('Some file count exceeds limit', { maxCount })
        });
      }
      // size check
      if (!maxSize) {
        return onSelectFile(files);
      }
      const filterFiles = files.filter((item) => item.file.size <= maxSize);

      if (filterFiles.length < files.length) {
        toast({
          status: 'warning',
          title: fileT('Some file size exceeds limit', { maxSize: formatFileSize(maxSize) })
        });
      }

      return onSelectFile(filterFiles);
    },
    [fileT, maxCount, maxSize, onSelectFile, selectFiles.length, toast]
  );

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const fileList: SelectFileItemType[] = [];

    const firstEntry = items[0].webkitGetAsEntry();

    if (firstEntry?.isDirectory && items.length === 1) {
      {
        const readFile = (entry: any) => {
          return new Promise((resolve) => {
            entry.file((file: File) => {
              const folderPath = (entry.fullPath || '').split('/').slice(2, -1).join('/');

              if (filterTypeReg.test(file.name)) {
                fileList.push({
                  fileId: getNanoid(),
                  folderPath,
                  file
                });
              }
              resolve(file);
            });
          });
        };
        const traverseFileTree = (dirReader: any) => {
          return new Promise((resolve) => {
            let fileNum = 0;
            dirReader.readEntries(async (entries: any[]) => {
              for await (const entry of entries) {
                if (entry.isFile) {
                  await readFile(entry);
                  fileNum++;
                } else if (entry.isDirectory) {
                  await traverseFileTree(entry.createReader());
                }
              }

              // chrome: readEntries will return 100 entries at most
              if (fileNum === 100) {
                await traverseFileTree(dirReader);
              }
              resolve('');
            });
          });
        };

        for await (const item of items) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              await readFile(entry);
            } else if (entry.isDirectory) {
              //@ts-ignore
              await traverseFileTree(entry.createReader());
            }
          }
        }
      }
    } else if (firstEntry?.isFile) {
      const files = Array.from(e.dataTransfer.files);
      let isErr = files.some((item) => item.type === '');
      if (isErr) {
        return toast({
          title: fileT('upload error description'),
          status: 'error'
        });
      }

      fileList.push(
        ...files
          .filter((item) => filterTypeReg.test(item.name))
          .map((file) => ({
            fileId: getNanoid(),
            folderPath: '',
            file
          }))
      );
    } else {
      return toast({
        title: fileT('upload error description'),
        status: 'error'
      });
    }

    selectFileCallback(fileList.slice(0, maxCount));
  };

  return (
    <MyBox
      isLoading={isFileUploading}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      px={3}
      py={[4, 7]}
      borderWidth={'1.5px'}
      borderStyle={'dashed'}
      borderRadius={'md'}
      {...(isMaxSelected
        ? {}
        : {
            cursor: 'pointer',
            _hover: {
              bg: 'primary.50',
              borderColor: 'primary.600'
            },
            borderColor: isDragging ? 'primary.600' : 'borderColor.high',
            onDragEnter: handleDragEnter,
            onDragOver: (e) => e.preventDefault(),
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
            onClick: onOpen
          })}
      {...props}
    >
      <MyIcon name={'common/uploadFileFill'} w={'32px'} />
      {isMaxSelected ? (
        <>
          <Box color={'myGray.500'} fontSize={'xs'}>
            已达到最大文件数量
          </Box>
        </>
      ) : (
        <>
          <Box fontWeight={'bold'}>
            {isDragging
              ? fileT('Release the mouse to upload the file')
              : fileT('Select and drag file tip')}
          </Box>
          {/* file type */}
          <Box color={'myGray.500'} fontSize={'xs'}>
            {fileT('Support file type', { fileType })}
          </Box>
          <Box color={'myGray.500'} fontSize={'xs'}>
            {/* max count */}
            {maxCount && fileT('Support max count', { maxCount })}
            {/* max size */}
            {maxSize && fileT('Support max size', { maxSize: formatFileSize(maxSize) })}
          </Box>

          <File
            onSelect={(files) =>
              selectFileCallback(
                files.map((file) => ({
                  fileId: getNanoid(),
                  folderPath: '',
                  file
                }))
              )
            }
          />
        </>
      )}
    </MyBox>
  );
};

export default React.memo(FileSelector);
