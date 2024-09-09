import React, { useMemo } from 'react';
import { ModalBody, Box, useTheme } from '@chakra-ui/react';

import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'next-i18next';
import type { SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';
import QuoteItem from '../../core/dataset/QuoteItem';
import RawSourceBox from '../../core/dataset/RawSourceBox';

const QuoteModal = ({
  rawSearch = [],
  onClose,
  showDetail,
  metadata
}: {
  rawSearch: SearchDataResponseItemType[];
  onClose: () => void;
  showDetail: boolean;
  metadata?: {
    collectionId: string;
    sourceId?: string;
    sourceName: string;
  };
}) => {
  const { t } = useTranslation();
  const filterResults = useMemo(
    () =>
      metadata
        ? rawSearch.filter(
            (item) =>
              item.collectionId === metadata.collectionId && item.sourceId === metadata.sourceId
          )
        : rawSearch,
    [metadata, rawSearch]
  );

  return (
    <>
      <MyModal
        isOpen={true}
        onClose={onClose}
        maxH={['90vh', '80vh']}
        isCentered
        minW={['90vw', '900px']}
        py={'10px'}
        // iconSrc={!!metadata ? undefined : '/imgs/modal/quote.svg'}
        title={
          <Box color={'black.30'} >
            {metadata ? (
              <RawSourceBox {...metadata} canView={showDetail} />
            ) : (
            //   <>{t('core.chat.Quote Amount', { amount: rawSearch.length })}</>
               <>{'知识库引用 · 共' + rawSearch.length + ' 条'}</>
            )}
            <Box mt={1} fontSize={'xs'} color={'myGray.500'} fontWeight={'normal'}>
              {t('core.chat.quote.Quote Tip')}
            </Box>
          </Box>
        }
      >
        <ModalBody>
          <QuoteList rawSearch={filterResults} showDetail={showDetail} />
        </ModalBody>
      </MyModal>
    </>
  );
};

export default QuoteModal;

export const QuoteList = React.memo(function QuoteList({
  rawSearch = [],
  showDetail
}: {
  rawSearch: SearchDataResponseItemType[];
  showDetail: boolean;
}) {
  const theme = useTheme();

  return (
    <>
      {rawSearch.map((item, i) => (
        <Box
          key={i}
          flex={'1 0 0'}
          px={4}
          pt={2}
          pb={3}
          borderRadius={'sm'}
          _notLast={{ mb: 2 }}
          _hover={{ '& .hover-data': { display: 'flex' } }}
          bg={'myGray.22'}
        >
          <QuoteItem quoteItem={item} canViewSource={showDetail} linkToDataset={showDetail} />
        </Box>
      ))}
    </>
  );
});
