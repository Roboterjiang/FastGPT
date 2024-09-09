import { Box, Card, Flex } from '@chakra-ui/react';
import React, { useCallback, useRef } from 'react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import { UserType } from '@fastgpt/global/support/user/type';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useForm } from 'react-hook-form';
import { UserUpdateParams } from '@/types/user';
import { langMap, setLngStore } from '@/web/common/utils/i18n';
import { useRouter } from 'next/router';
import MySelect from '@fastgpt/web/components/common/MySelect';
import TimezoneSelect from '@fastgpt/web/components/common/MySelect/TimezoneSelect';
import { timezoneList } from '@fastgpt/global/common/time/timezone';

const Individuation = () => {
  const { t, i18n } = useTranslation();
  const { userInfo, updateUserInfo } = useUserStore();
  const { toast } = useToast();
  const router = useRouter();
  const timezones = useRef(timezoneList());

  const { reset } = useForm<UserUpdateParams>({
    defaultValues: userInfo as UserType
  });

  const onclickSave = useCallback(
    async (data: UserType) => {
      console.log('data', data);
      await updateUserInfo({
        timezone: data.timezone
      });
      reset(data);
      toast({
        title: t('dataset.data.Update Success Tip'),
        status: 'success'
      });
    },
    [reset, t, toast, updateUserInfo]
  );

  return (
    <Box>
      <Flex bg={'myGray.25'} pl={5} alignItems={'center'} fontSize={'sm'} h={'50px'}>
        <MyIcon color={'primary.10'} mr={2} name={'support/user/iconSettings'} w={'0.9rem'} />
        {t('support.account.Individuation')}
      </Flex>

      <Card pl={5} fontSize={'sm'} boxShadow={'0'}>
        <Flex mt={5} alignItems={'center'} w={['85%', '420px']}>
          <Box flex={'0 0 80px'}>{t('user.Language')}</Box>
          <Box flex={'1 0 0'}>
            <MySelect
              bg={'myGray.20'}
              value={i18n.language}
              list={Object.entries(langMap).map(([key, lang]) => ({
                label: lang.label,
                value: key
              }))}
              onchange={(val: any) => {
                const lang = val;
                setLngStore(lang);
                router.replace(
                  {
                    query: router.query
                  },
                  router.asPath,
                  { locale: lang }
                );
              }}
            />
          </Box>
        </Flex>
        <Flex mt={6} alignItems={'center'} w={['85%', '420px']}>
          <Box flex={'0 0 80px'}>{t('user.Timezone')}:&nbsp;</Box>
          <Box flex={'1 0 0'}>
            <MySelect
              bg={'myGray.20'}
              value={userInfo?.timezone}
              list={timezones.current.map((item) => ({
                label: item.name,
                value: item.value
              }))}
              onchange={(val: any) => {
                if (!userInfo) return;
                onclickSave({ ...userInfo, timezone: val });
              }}
            />
          </Box>
          {/*<TimezoneSelect*/}
          {/*  value={userInfo?.timezone}*/}
          {/*  onChange={(e) => {*/}
          {/*    if (!userInfo) return;*/}
          {/*    onclickSave({ ...userInfo, timezone: e });*/}
          {/*  }}*/}
          {/*/>*/}
        </Flex>
      </Card>
    </Box>
  );
};

export default Individuation;
