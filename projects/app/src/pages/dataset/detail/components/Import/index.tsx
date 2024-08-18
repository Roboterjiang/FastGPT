import React, { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { ImportDataSourceEnum } from '@fastgpt/global/core/dataset/constants';
import { useContextSelector } from 'use-context-selector';
import DatasetImportContextProvider, { DatasetImportContext } from './Context';

const FileLocal = dynamic(() => import('./diffSource/FileLocal'));
const FileLink = dynamic(() => import('./diffSource/FileLink'));
const FileCustomText = dynamic(() => import('./diffSource/FileCustomText'));
const TableLocal = dynamic(() => import('./diffSource/TableLocal'));
const ExternalFileCollection = dynamic(() => import('./diffSource/ExternalFile'));

const ImportDataset = ({
  datasetId,
  kb_id,
  doc_type
}: {
  datasetId: string;
  kb_id: string;
  doc_type: string;
}) => {
  const importSource = useContextSelector(DatasetImportContext, (v) => v.importSource);

  const ImportComponent = useMemo(() => {
    if (importSource === ImportDataSourceEnum.fileLocal) return FileLocal;
    if (importSource === ImportDataSourceEnum.fileLink) return FileLink;
    if (importSource === ImportDataSourceEnum.fileCustom) return FileCustomText;
    if (importSource === ImportDataSourceEnum.csvTable) return TableLocal;
    if (importSource === ImportDataSourceEnum.externalFile) return ExternalFileCollection;
  }, [importSource]);

  return ImportComponent ? (
    <Box flex={'1 0 0'} overflow={'auto'} position={'relative'}>
      <ImportComponent datasetId={datasetId} kb_id={kb_id} doc_type={doc_type} />
    </Box>
  ) : null;
};

const Render = ({
  datasetId,
  kb_id,
  doc_type
}: {
  datasetId: string;
  kb_id: string;
  doc_type: string;
}) => {
  return (
    <Flex flexDirection={'column'} bg={'white'} h={'100%'} px={[2, 9]} py={[2, 5]}>
      <DatasetImportContextProvider>
        <ImportDataset datasetId={datasetId} kb_id={kb_id} doc_type={doc_type} />
      </DatasetImportContextProvider>
    </Flex>
  );
};

export default React.memo(Render);
