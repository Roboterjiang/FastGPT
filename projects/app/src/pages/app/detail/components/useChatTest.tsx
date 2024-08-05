import { useUserStore } from '@/web/support/user/useUserStore';
import React, { useCallback, useRef, useState } from 'react';
import ChatBox from '@/components/ChatBox';
import type { ComponentRef, StartChatFnProps } from '@/components/ChatBox/type.d';
import { streamFetch } from '@/web/common/api/fetch';
import { adStreamFetch } from '@/web/common/api/adfetch';
import { checkChatSupportSelectFileByModules } from '@/web/core/chat/utils';
import {
  getDefaultEntryNodeIds,
  getMaxHistoryLimitFromNodes,
  initWorkflowEdgeStatus,
  storeNodes2RuntimeNodes
} from '@fastgpt/global/core/workflow/runtime/utils';
import { useMemoizedFn } from 'ahooks';
import { AppChatConfigType } from '@fastgpt/global/core/app/type';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from './context';
import { StoreNodeItemType } from '@fastgpt/global/core/workflow/type';
import { StoreEdgeItemType } from '@fastgpt/global/core/workflow/type/edge';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { getAllDataset, getDatasets, getAdDatasets } from '@/web/core/dataset/api';

export const useChatTest = ({
  nodes,
  edges,
  chatConfig
}: {
  nodes: StoreNodeItemType[];
  edges: StoreEdgeItemType[];
  chatConfig: AppChatConfigType;
}) => {
  const { userInfo } = useUserStore();
  const ChatBoxRef = useRef<ComponentRef>(null);
  const { appDetail } = useContextSelector(AppContext, (v) => v);
  const [kbIds, setKbIds] = useState([]);

  const startChat = useMemoizedFn(
    async ({ chatList, controller, generatingMessage, variables }: StartChatFnProps) => {
      /* get histories */
      //   let historyMaxLen = getMaxHistoryLimitFromNodes(nodes);

      //   const history = chatList.slice(-historyMaxLen - 2, -2);

      console.log('爱动创建应用node', nodes);

      //根据appId 获取知识库id

      const node = nodes.find((x) => x.flowNodeType == FlowNodeTypeEnum.datasetSearchNode);
      let kb_ids = [];
      if (node) {
        const datasetInfos = node?.inputs.find((x) => x.key === 'datasets')?.value;
        kb_ids = datasetInfos.map((x) => x.kb_id);
      }
      const prompt = chatList[chatList.length - 2].value;

      const startIndex = chatList.length - 2;
      // 计算需要截取的起始索引，确保不会产生负数索引
      const endIndex = Math.max(startIndex - 10, 0);
      // 获取从倒数第二条数据往前的11条数据
      const sliceResult = chatList.slice(endIndex, startIndex + 1);
      const history =
        chatList.length > 2
          ? sliceResult.map((item) => ({
              content: item.value[0].text?.content,
              role: item.obj == 'Human' ? 'user' : 'assistant'
            }))
          : [];

      // 流请求，获取数据
      const { responseText, responseData } = await adStreamFetch({
        // url: '/api/core/chat/chatTest',
        data: {
          history,
          prompt: prompt,
          nodes: storeNodes2RuntimeNodes(nodes, getDefaultEntryNodeIds(nodes)),
          edges: initWorkflowEdgeStatus(edges),
          variables,
          appId: appDetail._id,
          appName: `调试-${appDetail.name}`,
          user_id: 'user' + userInfo?._id,
          kb_ids: kb_ids,
          question: prompt[0].text.content
        },
        onMessage: generatingMessage,
        abortCtrl: controller
      });

      return { responseText, responseData };
    }
  );

  const resetChatBox = useCallback(() => {
    ChatBoxRef.current?.resetHistory([]);
    ChatBoxRef.current?.resetVariables();
  }, []);

  const CustomChatBox = useMemoizedFn(() => (
    <ChatBox
      ref={ChatBoxRef}
      appId={appDetail._id}
      appAvatar={appDetail.avatar}
      userAvatar={userInfo?.avatar}
      showMarkIcon
      chatConfig={chatConfig}
      showFileSelector={checkChatSupportSelectFileByModules(nodes)}
      onStartChat={startChat}
      onDelMessage={() => {}}
    />
  ));

  return {
    resetChatBox,
    ChatBox: CustomChatBox
  };
};

export default function Dom() {
  return <></>;
}
