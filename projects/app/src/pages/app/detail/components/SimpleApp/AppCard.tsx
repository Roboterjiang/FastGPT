import React, { useState } from 'react';
import {
  Box,
  Flex,
  Button,
  IconButton,
  HStack,
  Modal,
  ModalBody,
  Checkbox,
  ModalFooter,
  Input,
  Textarea
} from '@chakra-ui/react';
import { DragHandleIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { AppSchema } from '@fastgpt/global/core/app/type.d';
import { useTranslation } from 'next-i18next';
import Avatar from '@/components/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import TagsEditModal from '../TagsEditModal';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { AppContext } from '@/pages/app/detail/components/context';
import { useContextSelector } from 'use-context-selector';
import PermissionIconText from '@/components/support/permission/IconText';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useI18n } from '@/web/context/I18n';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { postTransition2Workflow } from '@/web/core/app/api/app';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';

const AppCard = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { appT } = useI18n();

  const { appDetail, setAppDetail, onOpenInfoEdit, onDelApp } = useContextSelector(
    AppContext,
    (v) => v
  );
  const appId = appDetail._id;
  const { feConfigs } = useSystemStore();
  const [TeamTagsSet, setTeamTagsSet] = useState<AppSchema>();

  // transition to workflow
  const [transitionCreateNew, setTransitionCreateNew] = useState<boolean>();
  const { runAsync: onTransition, loading: transiting } = useRequest2(
    () => postTransition2Workflow({ appId, createNew: transitionCreateNew }),
    {
      onSuccess: ({ id }) => {
        if (id) {
          router.replace({
            query: {
              appId: id
            }
          });
        } else {
          setAppDetail((state) => ({
            ...state,
            type: AppTypeEnum.workflow
          }));
        }
      },
      successToast: t('common.Success')
    }
  );

  return (
    <>
      {/* basic info */}
      <Box px={6} py={4} position={'relative'}>
        <Flex alignItems={'center'}>
          <Box fontWeight={'bold'} fontSize={'md'} flex={'1 0 0'} color={'primary.10'}>
            {/* <MyIcon name={'core/app/simpleMode/dataset'} w={'20px'} /> */}
            {/* i18n* */}
            {'基本信息'}
          </Box>
          {/* <Avatar src={appDetail.avatar} borderRadius={'md'} w={'28px'} /> */}
          {/* <Box ml={3} fontWeight={'bold'} fontSize={'md'} flex={'1 0 0'} color={'myGray.900'}>
            {appDetail.name}
          </Box> */}
        </Flex>

        <Box
          // flex={1}
          mt={3}
          mb={4}
          // className={'textEllipsis3'}
          // wordBreak={'break-all'}
          color={'myGray.600'}
          fontSize={'xs'}
          // minH={'46px'}
        >
          <Flex alignItems={'center'} justifyContent={'left'}>
            <Box>
              {/* i18n* */}
              {'应用名称'}
            </Box>
            <Box flex={1} ml={4}>
              <Input
                readOnly
                value={appDetail.name}
                // placeholder="输入应用名称"
                // bg={'myWhite.600'}
              />
            </Box>
            <Avatar ml={4} src={appDetail.avatar} borderRadius={'md'} w={'28px'} />
          </Flex>

          <Flex mt={3} alignItems={'top'} justifyContent={'left'}>
            <Box>
              {/* i18n* */}
              {'应用简介'}
            </Box>
            <Box flex={1} ml={4}>
              <Textarea
                readOnly
                value={appDetail.intro}
                // placeholder="应用简介"
                // bg={'myWhite.600'}
              />
            </Box>
          </Flex>
        </Box>

        {/* <Box
          flex={1}
          mt={3}
          mb={4}
          className={'textEllipsis3'}
          wordBreak={'break-all'}
          color={'myGray.600'}
          fontSize={'xs'}
          minH={'46px'}
        >
          {appDetail.intro || t('core.app.tip.Add a intro to app')}
        </Box> */}
        <HStack alignItems={'flex-end'}>
          <Button
            size={['sm', 'md']}
            variant={'whitePrimary'}
            leftIcon={<MyIcon name={'core/chat/chatLight'} w={'16px'} />}
            onClick={() => router.push(`/chat?appId=${appId}`)}
          >
            {t('core.Chat')}
          </Button>
          {appDetail.permission.hasManagePer && (
            <Button
              size={['sm', 'md']}
              variant={'whitePrimary'}
              leftIcon={<MyIcon name={'common/settingLight'} w={'16px'} />}
              onClick={onOpenInfoEdit}
            >
              {t('common.Setting')}
            </Button>
          )}
          {appDetail.permission.isOwner && (
            <MyMenu
              Button={
                <IconButton
                  variant={'whiteBase'}
                  size={['smSquare', 'mdSquare']}
                  icon={<MyIcon name={'more'} w={'1rem'} />}
                  aria-label={''}
                />
              }
              menuList={[
                {
                  children: [
                    // {
                    //   icon: 'core/app/type/workflow',
                    //   label: appT('Transition to workflow'),
                    //   onClick: () => setTransitionCreateNew(true)
                    // },
                    ...(appDetail.permission.hasWritePer && feConfigs?.show_team_chat
                      ? [
                          {
                            icon: 'core/chat/fileSelect',
                            label: t('common.Team Tags Set'),
                            onClick: () => setTeamTagsSet(appDetail)
                          }
                        ]
                      : [])
                  ]
                },
                {
                  children: [
                    {
                      icon: 'delete',
                      type: 'danger',
                      label: t('common.Delete'),
                      onClick: onDelApp
                    }
                  ]
                }
              ]}
            />
          )}
          <Box flex={1} />
          {/* <MyTag
            type="borderFill"
            colorSchema="gray"
            onClick={() => (appDetail.permission.hasManagePer ? onOpenInfoEdit() : undefined)}
          >
            <PermissionIconText defaultPermission={appDetail.defaultPermission} />
          </MyTag> */}
        </HStack>
      </Box>
      {TeamTagsSet && <TagsEditModal onClose={() => setTeamTagsSet(undefined)} />}
      {transitionCreateNew !== undefined && (
        <MyModal isOpen title={appT('Transition to workflow')} iconSrc="core/app/type/workflow">
          <ModalBody>
            <Box mb={3}>{appT('Transition to workflow create new tip')}</Box>
            <HStack cursor={'pointer'} onClick={() => setTransitionCreateNew((state) => !state)}>
              <Checkbox isChecked={transitionCreateNew} />
              <Box>{appT('Transition to workflow create new placeholder')}</Box>
            </HStack>
          </ModalBody>
          <ModalFooter>
            <Button variant={'whiteBase'} onClick={() => setTransitionCreateNew(undefined)} mr={3}>
              {t('common.Close')}
            </Button>
            <Button variant={'dangerFill'} isLoading={transiting} onClick={() => onTransition()}>
              {t('common.Confirm')}
            </Button>
          </ModalFooter>
        </MyModal>
      )}
    </>
  );
};

export default React.memo(AppCard);
