import React, { useCallback } from 'react';
import { Box, Flex, useTheme } from '@chakra-ui/react';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import PageContainer from '@/components/PageContainer';
import SideTabs from '@/components/SideTabs';
import LightRowTabs from '@fastgpt/web/components/common/Tabs/LightRowTabs';
import UserInfo from './components/Info';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { useTranslation } from 'next-i18next';
import Script from 'next/script';

const Promotion = dynamic(() => import('./components/Promotion'));
const UsageTable = dynamic(() => import('./components/UsageTable'));
const BillTable = dynamic(() => import('./components/BillTable'));
const InformTable = dynamic(() => import('./components/InformTable'));
const ApiKeyTable = dynamic(() => import('./components/ApiKeyTable'));
const Individuation = dynamic(() => import('./components/Individuation'));

enum TabEnum {
  'info' = 'info',
  'promotion' = 'promotion',
  'usage' = 'usage',
  'bill' = 'bill',
  'inform' = 'inform',
  'individuation' = 'individuation',
  'apikey' = 'apikey',
  'loginout' = 'loginout'
}

const Account = ({ currentTab }: { currentTab: TabEnum }) => {
  const { t } = useTranslation();
  const { userInfo, setUserInfo } = useUserStore();
  const { feConfigs, isPc, systemVersion } = useSystemStore();

  const tabList = [
    {
      icon: 'support/user/userLight',
      label: t('user.Personal Information'),
      value: TabEnum.info
    },
    ...(feConfigs?.isPlus
      ? [
          {
            icon: 'support/usage/usageRecordLight',
            label: t('user.Usage Record'),
            value: TabEnum.usage
          }
        ]
      : []),
    ...(feConfigs?.show_pay && userInfo?.team?.permission.hasWritePer
      ? [
          {
            icon: 'support/bill/payRecordLight',
            label: t('support.wallet.Bills'),
            value: TabEnum.bill
          }
        ]
      : []),

    ...(feConfigs?.show_promotion
      ? [
          {
            icon: 'support/account/promotionLight',
            label: t('user.Promotion Record'),
            value: TabEnum.promotion
          }
        ]
      : []),
    // ...(userInfo?.team?.permission.hasWritePer
    //   ? [
    //       {
    //         icon: 'support/outlink/apikeyLight',
    //         label: t('user.apikey.key'),
    //         value: TabEnum.apikey
    //       }
    //     ]
    //   : []),
    {
      icon: 'support/user/iconSettings',
      label: t('support.account.Individuation'),
      value: TabEnum.individuation
    },
    ...(feConfigs.isPlus
      ? [
          {
            icon: 'support/user/informLight',
            label: t('user.Notice'),
            value: TabEnum.inform
          }
        ]
      : []),

    {
      icon: 'support/account/loginoutLight',
      label: t('user.Sign Out'),
      value: TabEnum.loginout
    }
  ];

  const { openConfirm, ConfirmModal } = useConfirm({
    content: t('user.Confirm to log out')
  });

  const router = useRouter();
  const theme = useTheme();

  const setCurrentTab = useCallback(
    (tab: string) => {
      if (tab === TabEnum.loginout) {
        openConfirm(() => {
          setUserInfo(null);
          router.replace('/login');
        })();
      } else {
        router.replace({
          query: {
            currentTab: tab
          }
        });
      }
    },
    [openConfirm, router, setUserInfo]
  );

  return (
    <>
      <Script src="/js/qrcode.min.js" strategy="lazyOnload"></Script>
      <PageContainer
        insertProps={{ boxShadow: '0', border: 'none', backgroundColor: 'myGray.100' }}
      >
        <Flex flexDirection={['column', 'row']} h={'100%'} pt={[4, 0]}>
          {isPc ? (
            <Flex
              bg={'myWhite.100'}
              borderRadius={[0, '16px']}
              flexDirection={'column'}
              p={4}
              h={'100%'}
              flex={'0 0 200px'}
              mr={2}
            >
              <Box mb={3} display={'flex'} alignItems={'center'}>
                <Box mr={2} w={'5px'} h={'20px'} backgroundColor={'primary.10'}></Box>
                <Box>{currentTab === TabEnum.info ? '账户' : '个性化'}</Box>
              </Box>
              <SideTabs<TabEnum>
                flex={1}
                mx={'auto'}
                mt={2}
                w={'100%'}
                list={tabList}
                value={currentTab}
                onChange={setCurrentTab}
              />
              <Flex alignItems={'center'}>
                <Box w={'8px'} h={'8px'} borderRadius={'50%'} bg={'#67c13b'} />
                <Box fontSize={'md'} ml={2}>
                  V{systemVersion}
                </Box>
              </Flex>
            </Flex>
          ) : (
            <Box mb={3}>
              <LightRowTabs<TabEnum>
                m={'auto'}
                size={isPc ? 'md' : 'sm'}
                list={tabList.map((item) => ({
                  value: item.value,
                  label: item.label
                }))}
                value={currentTab}
                onChange={setCurrentTab}
              />
            </Box>
          )}

          <Box
            bg={'myWhite.100'}
            borderRadius={[0, '16px']}
            flex={'1 0 0'}
            h={'100%'}
            pb={[4, 0]}
            overflow={'auto'}
          >
            {currentTab === TabEnum.info && <UserInfo />}
            {currentTab === TabEnum.promotion && <Promotion />}
            {currentTab === TabEnum.usage && <UsageTable />}
            {currentTab === TabEnum.bill && <BillTable />}
            {currentTab === TabEnum.individuation && <Individuation />}
            {currentTab === TabEnum.inform && <InformTable />}
            {currentTab === TabEnum.apikey && <ApiKeyTable />}
          </Box>
        </Flex>
        <ConfirmModal />
      </PageContainer>
    </>
  );
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      currentTab: content?.query?.currentTab || TabEnum.info,
      ...(await serviceSideProps(content, ['publish', 'user']))
    }
  };
}

export default Account;
