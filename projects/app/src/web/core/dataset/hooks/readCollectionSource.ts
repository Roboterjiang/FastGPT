import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getCollectionSource } from '@/web/core/dataset/api';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'next-i18next';

export function getCollectionSourceAndOpen(collectionId: string) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setLoading } = useSystemStore();

  return async () => {
    try {
      setLoading(true);
      const { value: url } = await getCollectionSource(collectionId);

      if (!url) {
        throw new Error('No file found');
      }

      if (url.startsWith('/')) {
        window.open(`${location.origin}${url}`, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast({
        title: getErrText(error, t('error.fileNotFound')),
        status: 'error'
      });
    }
    setLoading(false);
  };
}

export function getAdCollectionSourceAndOpen(fileUrl: string) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setLoading } = useSystemStore();

  return async () => {
    try {
      setLoading(true);

      if (!fileUrl) {
        throw new Error('No file found');
      }
      if (fileUrl.startsWith('/')) {
        window.open(`${location.origin}${fileUrl}`, '_blank');
      } else {
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: getErrText(error, t('error.fileNotFound')),
        status: 'error'
      });
    }
    setLoading(false);
  };
}
