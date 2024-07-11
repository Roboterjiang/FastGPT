import { postUploadImg, postUploadFiles,postAidongUploadFiles } from '@/web/common/file/api';
import { UploadImgProps } from '@fastgpt/global/common/file/api';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import { preUploadImgProps } from '@fastgpt/global/common/file/api';
import { compressBase64Img, type CompressImgProps } from '@fastgpt/web/common/file/img';

/**
 * upload file to mongo gridfs
 */
export const uploadFile2DB = ({
  file,
  bucketName,
  metadata = {},
  percentListen
}: {
  file: File;
  bucketName: `${BucketNameEnum}`;
  metadata?: Record<string, any>;
  percentListen?: (percent: number) => void;
}) => {
  const form = new FormData();
  form.append('metadata', JSON.stringify(metadata));
  form.append('bucketName', bucketName);
  form.append('file', file, encodeURIComponent(file.name));
  return postUploadFiles(form, (e) => {
    if (!e.total) return;

    const percent = Math.round((e.loaded / e.total) * 100);
    percentListen && percentListen(percent);
  });
};


export const uploadFile2AidongDB = ({
    kb_id,
    user_id,
    file,
    percentListen
  }: {
    file: File;
    kb_id:string,
    user_id:string,
    percentListen?: (percent: number) => void;
  }) => {
    const form = new FormData();
    form.append('kb_id', kb_id);
    form.append('user_id', 'user'+user_id);
    form.append('files', file, file.name);
    return postAidongUploadFiles(form, (e) => {
      if (!e.total) return;
         const percent = Math.round((e.loaded / e.total) * 100);
        percentListen && percentListen(percent);
    });
  };


export const getUploadBase64ImgController = (
  props: CompressImgProps & UploadImgProps,
  retry = 3
): Promise<string> => {
  try {
    return compressBase64ImgAndUpload({
      maxW: 4000,
      maxH: 4000,
      maxSize: 1024 * 1024 * 5,
      ...props
    });
  } catch (error) {
    if (retry > 0) {
      return getUploadBase64ImgController(props, retry - 1);
    }
    return Promise.reject(error);
  }
};

/**
 * compress image. response base64
 * @param maxSize The max size of the compressed image
 */
export const compressBase64ImgAndUpload = async ({
  base64Img,
  maxW,
  maxH,
  maxSize,
  ...props
}: UploadImgProps & CompressImgProps) => {
  const compressUrl = await compressBase64Img({
    base64Img,
    maxW,
    maxH,
    maxSize
  });

  return postUploadImg({
    ...props,
    base64Img: compressUrl
  });
};

export const compressImgFileAndUpload = async ({
  file,
  ...props
}: preUploadImgProps &
  CompressImgProps & {
    file: File;
  }) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);

  const base64Img = await new Promise<string>((resolve, reject) => {
    reader.onload = async () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      console.log(err);
      reject('Load image error');
    };
  });

  return compressBase64ImgAndUpload({
    base64Img,
    ...props
  });
};
