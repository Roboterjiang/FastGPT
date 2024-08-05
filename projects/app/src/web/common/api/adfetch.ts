import { SseResponseEventEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import { getErrText } from '@fastgpt/global/common/error/utils';
import type { ChatHistoryItemResType } from '@fastgpt/global/core/chat/type.d';
import type { StartChatFnProps } from '@/components/ChatBox/type.d';
import { DispatchNodeResponseKeyEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import dayjs from 'dayjs';
import {
  // refer to https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web
  EventStreamContentType,
  fetchEventSource
} from '@fortaine/fetch-event-source';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { useSystemStore } from '../system/useSystemStore';

import { insertChatItem2DB } from '@/web/core/dataset/api';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';

type StreamFetchProps = {
  url?: string;
  data: Record<string, any>;
  onMessage: StartChatFnProps['generatingMessage'];
  abortCtrl: AbortController;
};
export type StreamResponseType = {
  responseText: string;
  [DispatchNodeResponseKeyEnum.nodeResponse]: ChatHistoryItemResType[];
};
class FatalError extends Error {}

export const adStreamFetch = ({
  url = `/api/aidong/kbqa/adrag_chat`,
  data,
  onMessage,
  abortCtrl
}: StreamFetchProps) =>
  new Promise<StreamResponseType>(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      abortCtrl.abort('Time out');
    }, 60000);

    // response data
    let responseText = '';
    let responseImageList: string[] = [];
    let responseQueue: (
      | { event: SseResponseEventEnum.fastAnswer | SseResponseEventEnum.answer; text: string }
      | {
          event:
            | SseResponseEventEnum.toolCall
            | SseResponseEventEnum.toolParams
            | SseResponseEventEnum.toolResponse;
          [key: string]: any;
        }
    )[] = [];
    let errMsg: string | undefined;
    let responseData: ChatHistoryItemResType[] = [];
    let finished = false;

    const finish = () => {
      if (errMsg !== undefined) {
        return failedFinish();
      }
      //插入此次聊天记录到数据库
      return resolve({
        responseText,
        responseData
      });
    };
    const failedFinish = (err?: any) => {
      finished = true;
      reject({
        message: getErrText(err, errMsg ?? '服务器开小差了，请稍后再试~'),
        responseText
      });
    };

    const isAnswerEvent = (event: SseResponseEventEnum) =>
      event === SseResponseEventEnum.answer || event === SseResponseEventEnum.fastAnswer;
    // animate response to make it looks smooth
    function animateResponseText() {
      // abort message
      if (abortCtrl.signal.aborted) {
        responseQueue.forEach((item) => {
          onMessage(item);
          if (isAnswerEvent(item.event)) {
            responseText += item.text;
          }
        });
        return finish();
      }

      if (responseQueue.length > 0) {
        const fetchCount = Math.max(1, Math.ceil(responseQueue.length / 30));
        for (let i = 0; i < fetchCount; i++) {
          const item = responseQueue[i];
          onMessage(item);
          if (isAnswerEvent(item.event)) {
            responseText += item.text;
          }
        }

        responseQueue = responseQueue.slice(fetchCount);
      }

      if (finished && responseQueue.length === 0) {
        return finish();
      }

      requestAnimationFrame(animateResponseText);
    }
    // start animation
    animateResponseText();

    try {
      // auto complete variables
      const variables = data?.variables || {};
      variables.cTime = dayjs().format('YYYY-MM-DD HH:mm:ss dddd');

      const postData = {
        user_id: data?.user_id,
        kb_ids: data?.kb_ids,
        streaming: true,
        question: data?.question
      };

      const requestData = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortCtrl.signal,
        // body: JSON.stringify(postData)
        body: JSON.stringify({
          ...postData,
          ...data,
          variables,
          detail: true,
          stream: true
        })
      };

      // send request
      await fetchEventSource(url, {
        ...requestData,
        async onopen(res) {
          console.log('fetchEventSource-open', res);

          clearTimeout(timeoutId);
          const contentType = res.headers.get('content-type');

          // not stream
          if (contentType?.startsWith('text/plain')) {
            return failedFinish(await res.clone().text());
          }

          // failed stream
          if (
            !res.ok ||
            !res.headers.get('content-type')?.startsWith(EventStreamContentType) ||
            res.status !== 200
          ) {
            try {
              failedFinish(await res.clone().json());
            } catch {
              const errText = await res.clone().text();
              if (!errText.startsWith('event: error')) {
                failedFinish();
              }
            }
          }
        },
        onmessage({ event, data }) {
          if (data === '[DONE]') {
            return;
          }

          const aidongEvent = event || SseResponseEventEnum.answer;

          // parse text to json
          const parseJson = (() => {
            try {
              return JSON.parse(data);
            } catch (error) {
              return {};
            }
          })();
          if (aidongEvent === SseResponseEventEnum.answer) {
            const text = parseJson.response;
            for (const item of text) {
              responseQueue.push({
                event: aidongEvent,
                text: item
              });
            }
            //获取应用文档和图片
            if (parseJson.source_documents && parseJson.source_documents.length > 0) {
              const quoteList = parseJson.source_documents.map((x) => {
                return {
                  sourceName: x.file_name,
                  a: x.content,
                  q: x.retrieval_query
                };
              });
              parseJson.source_documents.forEach((x) => {
                if (x.image) {
                  const tempdata = 'data:image/png;base64,' + x.image;
                  responseImageList.push(`<img src="${tempdata}" />`);
                }
              });
              responseData = [
                {
                  nodeId: new Date().getTime() + '',
                  moduleName: '知识库检索',
                  moduleType: FlowNodeTypeEnum.datasetSearchNode,
                  imageList: responseImageList,
                  quoteList
                }
              ];
            }
          } else if (aidongEvent === SseResponseEventEnum.fastAnswer) {
            const text = parseJson.choices?.[0]?.delta?.content || '';
            responseQueue.push({
              event: aidongEvent,
              text
            });
          } else if (
            aidongEvent === SseResponseEventEnum.toolCall ||
            aidongEvent === SseResponseEventEnum.toolParams ||
            aidongEvent === SseResponseEventEnum.toolResponse
          ) {
            responseQueue.push({
              event: aidongEvent,
              ...parseJson
            });
          } else if (aidongEvent === SseResponseEventEnum.flowNodeStatus) {
            onMessage({
              event: aidongEvent,
              ...parseJson
            });
          } else if (
            aidongEvent === SseResponseEventEnum.flowResponses &&
            Array.isArray(parseJson)
          ) {
            responseData = parseJson;
          } else if (aidongEvent === SseResponseEventEnum.updateVariables) {
            onMessage({
              event: aidongEvent,
              variables: parseJson
            });
          } else if (aidongEvent === SseResponseEventEnum.error) {
            if (parseJson.statusText === TeamErrEnum.aiPointsNotEnough) {
              useSystemStore.getState().setIsNotSufficientModal(true);
            }
            errMsg = getErrText(parseJson, '流响应错误');
          }
        },
        onclose() {
          finished = true;
          //聊天成功后，聊天记录传入数据
        },
        onerror(err) {
          console.log('fetchEventSource-err', err);
          if (err instanceof FatalError) {
            throw err;
          }
          clearTimeout(timeoutId);
          failedFinish(getErrText(err));
        },
        openWhenHidden: true
      });
    } catch (err: any) {
      console.log('fetchEventSource-err', err);

      clearTimeout(timeoutId);

      if (abortCtrl.signal.aborted) {
        finished = true;

        return;
      }
      console.log(err, 'fetch error');

      failedFinish(err);
    }
  });
