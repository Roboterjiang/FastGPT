import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password } = req.body as PostLoginProps;

    if (!username || !password) {
      throw new Error('缺少参数');
    }

    // 检测用户是否存在
    const authCert = await MongoUser.findOne(
      {
        username
      },
      'status'
    );
    if (authCert) {
      throw new Error('用户已注册');
    }
    await mongoSessionRun(async (session) => {
      // init root user
      const [{ _id }] = await MongoUser.create([
        {
          username,
          password: hashStr(password)
        }
      ]);
      // init root team
      await createDefaultTeam({ userId: _id, teamName: username, balance: 9999 * 100000, session });
    });

    jsonRes(res, {
      data: {}
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
