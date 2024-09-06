import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { ClearHistoriesProps } from '@/global/core/chat/api';
import { authOutLink } from '@/service/support/permission/auth/outLink';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { authTeamSpaceToken } from '@/service/support/permission/auth/team';

/* 批量删除聊天历史 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId, shareId, outLinkUid, teamId, teamToken,chatIds } = req.body as ClearHistoriesProps&{chatIds?:string[]};

    let chatAppId = appId;

    console.log("chatIds",chatIds)

    const match = await (async () => {
      if (shareId && outLinkUid) {
        const { appId, uid } = await authOutLink({ shareId, outLinkUid });

        chatAppId = appId;
        return {
          shareId,
          outLinkUid: uid
        };
      }
      if (teamId && teamToken) {
        const { uid } = await authTeamSpaceToken({ teamId, teamToken });
        return {
          teamId,
          appId,
          outLinkUid: uid
        };
      }
      if (appId) {
        const { tmbId } = await authCert({ req, authToken: true });

        return {
          tmbId,
          appId,
          source: ChatSourceEnum.online
        };
      }

      return Promise.reject('Param are error');
    })();

    // find chatIds
    const idList = chatIds;

    await MongoChatItem.deleteMany({
      appId: chatAppId,
      chatId: { $in: idList }
    });
    await MongoChat.deleteMany({
      appId: chatAppId,
      chatId: { $in: idList }
    });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
