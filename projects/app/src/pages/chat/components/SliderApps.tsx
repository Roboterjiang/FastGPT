import React, { useCallback } from 'react';
import { Flex, Box, IconButton, HStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import Avatar from '@/components/Avatar';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import MyDivider from '@fastgpt/web/components/common/MyDivider';
import MyPopover from '@fastgpt/web/components/common/MyPopover/index';
import { getMyApps } from '@/web/core/app/api';
import {
  GetResourceFolderListProps,
  GetResourceListItemResponse
} from '@fastgpt/global/common/parentFolder/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import dynamic from 'next/dynamic';

const SelectOneResource = dynamic(() => import('@/components/common/folder/SelectOneResource'));

const SliderApps = ({ apps, activeAppId }: { apps: AppListItemType[]; activeAppId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isTeamChat = router.pathname === '/chat/team';

  const getAppList = useCallback(async ({ parentId }: GetResourceFolderListProps) => {
    return getMyApps({
      parentId,
      type: [AppTypeEnum.folder, AppTypeEnum.simple, AppTypeEnum.workflow]
    }).then((res) =>
      res.map<GetResourceListItemResponse>((item) => ({
        id: item._id,
        name: item.name,
        avatar: item.avatar,
        isFolder: item.type === AppTypeEnum.folder
      }))
    );
  }, []);

  const onChangeApp = useCallback(
    (appId: string) => {
      router.replace({
        query: {
          ...router.query,
          chatId: '',
          appId
        }
      });
    },
    [router]
  );

  return (
    <Flex flexDirection={'column'} maxH={'350px'} minH={'230px'}>
      {/* <Box mt={4} px={4}>
        {!isTeamChat && (
          <Flex
            alignItems={'center'}
            cursor={'pointer'}
            py={2}
            px={3}
            borderRadius={'md'}
            _hover={{ bg: 'myGray.200' }}
            onClick={() => router.push('/app/list')}
          >
            <IconButton
              mr={3}
              icon={<MyIcon name={'common/backFill'} w={'1rem'} color={'primary.500'} />}
              bg={'white'}
              boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
              size={'smSquare'}
              borderRadius={'50%'}
              aria-label={''}
            />
            {t('core.chat.Exit Chat')}
          </Flex>
        )}
      </Box> */}

      {!isTeamChat && (
        <>
          {/* <MyDivider h={2} my={1} /> */}
          <HStack
            px={4}
            py={2}
            my={2}
            mx={3}
            mt={4}
            color={'myGray.500'}
            fontSize={'sm'}
            borderRadius={'30px'}
            bg={'myGray.100'}
            justifyContent={'space-between'}
          >
            <Box fontWeight={'bold'} fontSize={'md'} color={'black.30'}>
              {t('core.chat.Recent use')}
            </Box>
            <MyPopover
              placement="bottom-end"
              offset={[20, 10]}
              trigger="hover"
              Trigger={
                <HStack
                  spacing={0.5}
                  cursor={'pointer'}
                  px={2}
                  py={'0.5'}
                  borderRadius={'md'}
                  mr={-2}
                  userSelect={'none'}
                  _hover={{
                    bg: 'myGray.200'
                  }}
                >
                  <Box fontSize={'small'}>{t('common.More')}</Box>
                  <MyIcon name={'common/select'} w={'1rem'} />
                </HStack>
              }
            >
              {({ onClose }) => (
                <Box minH={'180px'}>
                  <SelectOneResource
                    value={activeAppId}
                    onSelect={(id) => {
                      if (!id) return;
                      onChangeApp(id);
                      onClose();
                    }}
                    server={getAppList}
                  />
                </Box>
              )}
            </MyPopover>
          </HStack>
        </>
      )}

      <Box flex={'1 0 0'} px={4} mt={2} h={0} overflow={'overlay'}>
        {apps.map((item) => (
          <Flex
            key={item._id}
            py={2}
            px={4}
            mb={3}
            cursor={'pointer'}
            borderRadius={'20px'}
            alignItems={'center'}
            fontSize={'sm'}
            {...(item._id === activeAppId
              ? {
                  bg: 'myGray.22',
                  color: 'primary.10',
                  borderWidth: '1px',
                  borderColor: 'primary.1'
                }
              : {
                  color: 'black.100',
                  _hover: {
                    bg: 'myGray.22'
                  },
                  onClick: () => onChangeApp(item._id)
                })}
          >
            <Avatar src={item.avatar} w={'12px'} />
            <Box ml={3} className={'textEllipsis'}>
              {item.name}
            </Box>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
};

export default SliderApps;
