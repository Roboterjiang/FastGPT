import React, { useCallback, useRef, useState } from 'react';
import NextHead from '@/components/common/NextHead';
import { useRouter } from 'next/router';
import { delChatRecordById, getChatHistories, getInitChatInfo } from '@/web/core/chat/api';
import { Box, Flex, Drawer, DrawerOverlay, DrawerContent, useTheme } from '@chakra-ui/react';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { streamFetch } from '@/web/common/api/fetch';
import { adStreamFetch } from '@/web/common/api/adfetch';

import { useChatStore } from '@/web/core/chat/context/storeChat';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'next-i18next';

import ChatBox from '@/components/ChatBox';
import type { ComponentRef, StartChatFnProps } from '@/components/ChatBox/type.d';
import PageContainer from '@/components/PageContainer';
import SideBar from '@/components/SideBar';
import ChatHistorySlider from './components/ChatHistorySlider';
import SliderApps from './components/SliderApps';
import ChatHeader from './components/ChatHeader';
import { useUserStore } from '@/web/support/user/useUserStore';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { checkChatSupportSelectFileByChatModels } from '@/web/core/chat/utils';
import { getChatTitleFromChatMessage } from '@fastgpt/global/core/chat/utils';
import { ChatStatusEnum } from '@fastgpt/global/core/chat/constants';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';

import { GPTMessages2Chats } from '@fastgpt/global/core/chat/adapt';
import { getMyApps, getAppDetailById } from '@/web/core/app/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';

import { insertChatItem2DB } from '@/web/core/dataset/api';

import { useMount } from 'ahooks';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { InitChatResponse } from '@/global/core/chat/api';
import { defaultChatData } from '@/global/core/chat/constants';
import ChatContextProvider, { ChatContext } from '@/web/core/chat/context/chatContext';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { useContextSelector } from 'use-context-selector';

import { getAllDataset, getDatasets, getAdDatasets } from '@/web/core/dataset/api';

type Props = { appId: string; chatId: string };

const Chat = ({
  appId,
  chatId,
  myApps
}: Props & {
  myApps: AppListItemType[];
}) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const ChatBoxRef = useRef<ComponentRef>(null);

  const { setLastChatAppId, setKbIds } = useChatStore();
  const {
    loadHistories,
    onUpdateHistory,
    onClearHistories,
    onDelHistory,
    isOpenSlider,
    onCloseSlider,
    forbidLoadChat,
    onChangeChatId
  } = useContextSelector(ChatContext, (v) => v);

  const { userInfo } = useUserStore();
  const { isPc } = useSystemStore();

  const startChat = useCallback(
    async ({ messages, controller, generatingMessage, variables }: StartChatFnProps) => {
      const prompts = messages.slice(-2);
      const completionChatId = chatId ? chatId : getNanoid();

      //根据appId 获取知识库id
      const appInfo = await getAppDetailById(appId);
      const node = appInfo.modules.find(
        (x) => x.flowNodeType == FlowNodeTypeEnum.datasetSearchNode
      );
      const datasetInfos = node?.inputs.find((x) => x.key === 'datasets')?.value;
      const kb_ids = datasetInfos?.map((x) => x.kb_id);

      const startIndex = messages.length - 3;
      // 计算需要截取的起始索引，确保不会产生负数索引
      const endIndex = Math.max(startIndex - 10, 0);
      // 获取从倒数第二条数据往前的11条数据
      const sliceResult = messages.slice(endIndex, startIndex + 1);
      //默认取倒数第二条到 倒数第12条
      const history =
        messages.length > 2
          ? sliceResult.map((item) => ({
              content: item.content,
              role: item.role
            }))
          : [];

      const { responseText, responseData } = await adStreamFetch({
        data: {
          question: prompts?.find((x) => x.role === 'user')?.content,
          messages: prompts,
          variables,
          appId,
          chatId: completionChatId,
          history,
          user_id: 'user' + userInfo?._id,
          kb_ids: kb_ids
          // history:[],
          // user_id:"user66b1847b62eafd837ec06e5d",
          // kb_ids:['kb3f6ac6bf38e74d76b84455843f70d054']
        },
        onMessage: generatingMessage,
        abortCtrl: controller
      });

      const requestData = {
        messages: prompts,
        variables,
        appId,
        chatId: completionChatId,
        user_id: userInfo?._id,
        kb_ids: kb_ids,
        textResponse: responseText,
        responseData: responseData
      };
      await insertChatItem2DB(requestData);

      console.log('爱动responseData', responseData);

      const newTitle = getChatTitleFromChatMessage(GPTMessages2Chats(prompts)[0]);

      console.log('爱动newTitle', newTitle);

      // new chat
      if (completionChatId !== chatId) {
        if (controller.signal.reason !== 'leave') {
          onChangeChatId(completionChatId, true);
          loadHistories();
        }
      } else {
        // update chat
        onUpdateHistory({
          appId,
          chatId: completionChatId,
          title: newTitle
        });
      }

      // update chat window
      setChatData((state) => ({
        ...state,
        title: newTitle
      }));

      return { responseText, responseData, isNewChat: forbidLoadChat.current };
    },
    [appId, chatId, forbidLoadChat, loadHistories, onChangeChatId, onUpdateHistory]
  );

  // get chat app info
  const [chatData, setChatData] = useState<InitChatResponse>(defaultChatData);

  //   console.log("爱动chatData",chatData)

  const { loading } = useRequest2(
    async () => {
      if (!appId || forbidLoadChat.current) return;

      const res = await getInitChatInfo({ appId, chatId });
      const history = res.history.map((item) => ({
        ...item,
        dataId: item.dataId || getNanoid(),
        status: ChatStatusEnum.finish
      }));

      const result: InitChatResponse = {
        ...res,
        history
      };

      // reset chat box
      ChatBoxRef.current?.resetHistory(history);
      ChatBoxRef.current?.resetVariables(res.variables);
      if (history.length > 0) {
        setTimeout(() => {
          ChatBoxRef.current?.scrollToBottom('auto');
        }, 500);
      }

      setLastChatAppId(appId);
      setChatData(result);
    },
    {
      manual: false,
      refreshDeps: [appId, chatId],
      onError(e: any) {
        setLastChatAppId('');

        // reset all chat tore
        if (e?.code === 501) {
          router.replace('/app/list');
        } else if (chatId) {
          onChangeChatId('');
        }
      },
      onFinally() {
        forbidLoadChat.current = false;
      }
    }
  );

  return (
    <Flex h={'100%'}>
      <NextHead title={chatData.app.name} icon={chatData.app.avatar}></NextHead>
      {/* pc show myself apps */}
      {isPc && (
        <Box borderRight={theme.borders.base} w={'220px'} flexShrink={0}>
          <SliderApps apps={myApps} activeAppId={appId} />
        </Box>
      )}

      <PageContainer isLoading={loading} flex={'1 0 0'} w={0} p={[0, '16px']} position={'relative'}>
        <Flex h={'100%'} flexDirection={['column', 'row']} bg={'white'}>
          {/* pc always show history. */}
          {((children: React.ReactNode) => {
            return isPc || !appId ? (
              <SideBar>{children}</SideBar>
            ) : (
              <Drawer
                isOpen={isOpenSlider}
                placement="left"
                autoFocus={false}
                size={'xs'}
                onClose={onCloseSlider}
              >
                <DrawerOverlay backgroundColor={'rgba(255,255,255,0.5)'} />
                <DrawerContent maxWidth={'75vw'}>{children}</DrawerContent>
              </Drawer>
            );
          })(
            <ChatHistorySlider
              apps={myApps}
              confirmClearText={t('core.chat.Confirm to clear history')}
              appId={appId}
              appName={chatData.app.name}
              appAvatar={chatData.app.avatar}
              onDelHistory={(e) => onDelHistory({ ...e, appId })}
              onClearHistory={() => {
                onClearHistories({ appId });
              }}
              onSetHistoryTop={(e) => {
                onUpdateHistory({ ...e, appId });
              }}
              onSetCustomTitle={async (e) => {
                onUpdateHistory({
                  appId,
                  chatId: e.chatId,
                  customTitle: e.title
                });
              }}
            />
          )}
          {/* chat container */}
          <Flex
            position={'relative'}
            h={[0, '100%']}
            w={['100%', 0]}
            flex={'1 0 0'}
            flexDirection={'column'}
          >
            {/* header */}
            <ChatHeader
              appAvatar={chatData.app.avatar}
              appName={chatData.app.name}
              history={chatData.history}
              chatModels={chatData.app.chatModels}
              onRoute2AppDetail={() => router.push(`/app/detail?appId=${appId}`)}
              showHistory
            />

            {/* chat box */}
            <Box flex={1}>
              <ChatBox
                ref={ChatBoxRef}
                showEmptyIntro
                appAvatar={chatData.app.avatar}
                userAvatar={userInfo?.avatar}
                chatConfig={chatData.app?.chatConfig}
                showFileSelector={checkChatSupportSelectFileByChatModels(chatData.app.chatModels)}
                feedbackType={'user'}
                onStartChat={startChat}
                onDelMessage={({ contentId }) => delChatRecordById({ contentId, appId, chatId })}
                appId={appId}
                chatId={chatId}
              />
            </Box>
          </Flex>
        </Flex>
      </PageContainer>
    </Flex>
  );
};

const Render = (props: Props) => {
  const { appId } = props;
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const { lastChatAppId, lastChatId } = useChatStore();

  const { data: myApps = [], runAsync: loadMyApps } = useRequest2(
    () => getMyApps({ getRecentlyChat: true }),
    {
      manual: false
    }
  );

  const { data: histories = [], runAsync: loadHistories } = useRequest2(
    () => (appId ? getChatHistories({ appId }) : Promise.resolve([])),
    {
      manual: false,
      refreshDeps: [appId]
    }
  );

  // 初始化聊天框
  useMount(async () => {
    // pc: redirect to latest model chat
    if (!appId) {
      if (lastChatAppId) {
        return router.replace({
          query: {
            ...router.query,
            appId: lastChatAppId,
            chatId: lastChatId
          }
        });
      }

      const apps = await loadMyApps();
      if (apps.length === 0) {
        toast({
          status: 'error',
          title: t('core.chat.You need to a chat app')
        });
        router.replace('/app/list');
      } else {
        router.replace({
          query: {
            ...router.query,
            appId: apps[0]._id,
            chatId: ''
          }
        });
      }
    }
  });

  return (
    <ChatContextProvider histories={histories} loadHistories={loadHistories}>
      <Chat {...props} myApps={myApps} />
    </ChatContextProvider>
  );
};

export async function getServerSideProps(context: any) {
  return {
    props: {
      appId: context?.query?.appId || '',
      chatId: context?.query?.chatId || '',
      ...(await serviceSideProps(context, ['file']))
    }
  };
}

export default Render;
