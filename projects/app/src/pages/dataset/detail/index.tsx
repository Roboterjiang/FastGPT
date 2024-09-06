import React from 'react';
import { useRouter } from 'next/router';
import { Box, Flex } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { getErrText } from '@fastgpt/global/common/error/utils';
import dynamic from 'next/dynamic';
import PageContainer from '@/components/PageContainer';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { useTranslation } from 'next-i18next';

import Slider from './components/Slider';
import MyBox from '@fastgpt/web/components/common/MyBox';
import {
  DatasetPageContext,
  DatasetPageContextProvider
} from '@/web/core/dataset/context/datasetPageContext';
import CollectionPageContextProvider from './components/CollectionCard/Context';
import { useContextSelector } from 'use-context-selector';
import NextHead from '@/components/common/NextHead';

const CollectionCard = dynamic(() => import('./components/CollectionCard/index'));
const DataCard = dynamic(() => import('./components/DataCard'));
const Test = dynamic(() => import('./components/Test'));
const Info = dynamic(() => import('./components/Info'));
const Import = dynamic(() => import('./components/Import'));

export enum TabEnum {
  dataCard = 'dataCard',
  collectionCard = 'collectionCard',
  test = 'test',
  info = 'info',
  import = 'import'
}
type Props = { datasetId: string; currentTab: TabEnum; kb_id: string; doc_type: string };

const Detail = ({ datasetId, currentTab, kb_id, doc_type }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const datasetDetail = useContextSelector(DatasetPageContext, (v) => v.datasetDetail);
  const loadDatasetDetail = useContextSelector(DatasetPageContext, (v) => v.loadDatasetDetail);

  useQuery([datasetId], () => loadDatasetDetail(datasetId), {
    onError(err: any) {
      router.replace(`/dataset/list`);
      toast({
        title: t(getErrText(err, t('common.Load Failed'))),
        status: 'error'
      });
    }
  });

  return (
    <>
      <NextHead title={datasetDetail?.name} icon={datasetDetail?.avatar} />
      <PageContainer
        insertProps={{ boxShadow: '0', border: 'none', backgroundColor: 'myGray.100' }}
      >
        <MyBox display={'flex'} flexDirection={['column', 'row']} h={'100%'} pt={[4, 0]}>
          <Slider currentTab={currentTab} />

          {!!datasetDetail._id && (
            <Box bg={'myWhite.300'} flex={'1 0 0'} pb={0} overflow={'auto'}>
              {(currentTab === TabEnum.collectionCard||currentTab === TabEnum.info) && (
                <Flex px={[2, 6]} mt={'12px'} pb={5} justifyContent={'space-between'}>
                  <Flex alignItems={'center'}>
                    <Box mr={2} w={'3px'} h={'16px'} backgroundColor={'primary.10'}></Box>
                    <Box fontWeight={'bold'} fontSize={'14px'}>{currentTab === TabEnum.collectionCard?t('common.File'):'知识库配置'}</Box>
                  </Flex>
                  <Box
                    color={'primary.10'}
                    cursor={'pointer'}
                    onClick={() => router.replace('/dataset/list')}
                  >
                    {t('common.Back')}
                  </Box>
                </Flex>
              )}
              {currentTab === TabEnum.collectionCard && (
                <CollectionPageContextProvider>
                  <CollectionCard />
                </CollectionPageContextProvider>
              )}
              {currentTab === TabEnum.dataCard && <DataCard />}
              {currentTab === TabEnum.test && <Test datasetId={datasetId} />}
              {currentTab === TabEnum.info && <Info datasetId={datasetId} />}
              {currentTab === TabEnum.import && (
                <Import datasetId={datasetId} kb_id={kb_id} doc_type={doc_type} />
              )}
            </Box>
          )}
        </MyBox>
      </PageContainer>
    </>
  );
};

const Render = (data: Props) => (
  <DatasetPageContextProvider datasetId={data.datasetId}>
    <Detail {...data} />
  </DatasetPageContextProvider>
);
export default Render;

export async function getServerSideProps(context: any) {
  const currentTab = context?.query?.currentTab || TabEnum.collectionCard;
  const datasetId = context?.query?.datasetId;
  //日志打印在服务端
  console.log('爱动getServerSideProps', context.query);

  const kb_id = context?.query?.kb_id ?? '';
  const doc_type = context?.query?.doc_type ?? '';

  return {
    props: {
      currentTab,
      datasetId,
      kb_id,
      doc_type,
      ...(await serviceSideProps(context, ['dataset', 'file']))
    }
  };
}
