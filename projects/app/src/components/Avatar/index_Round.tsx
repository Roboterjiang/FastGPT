import React from 'react';
import { Box, Image } from '@chakra-ui/react';
import type { ImageProps } from '@chakra-ui/react';
import { LOGO_ICON } from '@fastgpt/global/common/system/constants';
import { AddIcon } from '@chakra-ui/icons'

const Avatar = ({ w = '30px', src, ...props }: ImageProps) => {
  return (
    <Image
      fallbackSrc={LOGO_ICON}
      fallbackStrategy={'onError'}
      // borderRadius={'md'}
      objectFit={'contain'}
      alt=""
      w={w}
      h={w}
      borderRadius={'50%'}
      src={src || LOGO_ICON}
      {...props}
    />
  );
};

export default Avatar;
