import React, { useCallback, useMemo, useState } from 'react';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '../context';
import FolderPath from '@/components/common/folder/Path';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getAppFolderPath } from '@/web/core/app/api/app';
import { Box, Button, Flex, IconButton } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import RouteTab from '../RouteTab';
import { useTranslation } from 'next-i18next';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
import { AppSimpleEditFormType } from '@fastgpt/global/core/app/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { form2AppWorkflow } from '@/web/core/app/utils';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { TabEnum } from '../context';
import PublishHistoriesSlider, { type InitProps } from '../PublishHistoriesSlider';
import { appWorkflow2Form } from '@fastgpt/global/core/app/utils';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { compareWorkflow } from '@/web/core/workflow/utils';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import { publishStatusStyle } from '../constants';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';

const Header = ({
  appForm,
  setAppForm
}: {
  appForm: AppSimpleEditFormType;
  setAppForm: React.Dispatch<React.SetStateAction<AppSimpleEditFormType>>;
}) => {
  const { t } = useTranslation();
  const { isPc } = useSystemStore();
  const router = useRouter();
  const { appId, appDetail, onPublish, currentTab } = useContextSelector(AppContext, (v) => v);

  const { data: paths = [] } = useRequest2(() => getAppFolderPath(appId), {
    manual: false,
    refreshDeps: [appId]
  });
  const onclickRoute = useCallback(
    (parentId: string) => {
      router.push({
        pathname: '/app/list',
        query: {
          parentId
        }
      });
    },
    [router]
  );

  const isPublished = useMemo(() => {
    const data = form2AppWorkflow(appForm);

    return compareWorkflow(
      {
        nodes: appDetail.modules,
        edges: [],
        chatConfig: appDetail.chatConfig
      },
      {
        nodes: data.nodes,
        edges: [],
        chatConfig: data.chatConfig
      }
    );
  }, [appDetail.chatConfig, appDetail.modules, appForm]);

  const onSubmitPublish = useCallback(
    async (data: AppSimpleEditFormType) => {
      const { nodes, edges } = form2AppWorkflow(data);
      await onPublish({
        nodes,
        edges,
        chatConfig: data.chatConfig,
        type: AppTypeEnum.simple
      });
    },
    [onPublish]
  );

  const [historiesDefaultData, setHistoriesDefaultData] = useState<InitProps>();

  return (
    <>
      <Box>
        <Flex h={'45px'} pl={2} pt={[1, 2]} pb={[1, 2]} my={'5px'} alignItems={'flex-start'} position={'relative'} bg={'white'} borderRadius={'10px'}>
          {!isPc && (
            <Flex pt={2} justifyContent={'center'}>
              <RouteTab />
            </Flex>
          )}
          {isPc && (
            <Box position={'absolute'} left={'50%'} transform={'translateX(-50%)'}>
              <RouteTab />
            </Box>
          )}
        </Flex>
      </Box>
      <Box py={1}>
        <Flex>
          <Box flex={'1'}>
            <FolderPath paths={paths} hoverStyle={{ color: 'primary.600' }} onClick={onclickRoute} />
          </Box>
          {currentTab === TabEnum.appEdit && (
            <Flex alignItems={'center'} ml={'auto'}>
              {!historiesDefaultData && (
                <>
                  <MyTag
                    mr={3}
                    type={'borderFill'}
                    showDot
                    colorSchema={
                      isPublished
                        ? publishStatusStyle.published.colorSchema
                        : publishStatusStyle.unPublish.colorSchema
                    }
                  >
                    {isPublished
                      ? t(publishStatusStyle.published.text)
                      : t(publishStatusStyle.unPublish.text)}
                  </MyTag>
                  <IconButton
                    mr={[2, 4]}
                    icon={<MyIcon name={'history'} w={'18px'} />}
                    aria-label={''}
                    size={'sm'}
                    w={'30px'}
                    variant={'whitePrimary'}
                    onClick={() => {
                      const { nodes, edges } = form2AppWorkflow(appForm);
                      setHistoriesDefaultData({
                        nodes,
                        edges,
                        chatConfig: appForm.chatConfig
                      });
                    }}
                  />
                  <PopoverConfirm
                    showCancel
                    content={t('core.app.Publish Confirm')}
                    Trigger={
                      <Box>
                        <MyTooltip label={t('core.app.Publish app tip')}>
                          <Button isDisabled={isPublished}>{t('core.app.Publish')}</Button>
                        </MyTooltip>
                      </Box>
                    }
                    onConfirm={() => onSubmitPublish(appForm)}
                  />
                </>
              )}
            </Flex>
          )}
          <Button
            ml={'5px'}
            variant='ghost'
            colorScheme={'primary'}
          >
            {/* i18n* */}
            {'返回'}
          </Button>
        </Flex>
        {!!historiesDefaultData && (
          <PublishHistoriesSlider
            initData={({ nodes, chatConfig }) => {
              setAppForm(
                appWorkflow2Form({
                  nodes,
                  chatConfig
                })
              );
            }}
            onClose={() => setHistoriesDefaultData(undefined)}
            defaultData={historiesDefaultData}
          />
        )}
      </Box>
    </>
  );
};

export default Header;
