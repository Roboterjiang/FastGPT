import React, { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { GridProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import type { IconNameType } from '@fastgpt/web/components/common/Icon/type.d';

export type Props<ValueType = string> = Omit<GridProps, 'onChange'> & {
  list: { value: ValueType; label: string; icon: string }[];
  value: ValueType;
  size?: 'sm' | 'md' | 'lg';
  onChange: (value: ValueType) => void;
};

const SideTabs = <ValueType = string,>({
  list,
  size = 'md',
  value,
  onChange,
  ...props
}: Props<ValueType>) => {
  const sizeMap = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          fontSize: 'xs',
          inlineP: 1
        };
      case 'md':
        return {
          fontSize: 'sm',
          inlineP: 2
        };
      case 'lg':
        return {
          fontSize: 'md',
          inlineP: 3
        };
    }
  }, [size]);

  return (
    <Box fontSize={sizeMap.fontSize} {...props}>
      {list.map((item) => (
        <Flex
          key={item.value as string}
          py={sizeMap.inlineP}
          borderRadius={'20px'}
          px={4}
          mb={2}
          fontWeight={'medium'}
          alignItems={'center'}
          {...(value === item.value
            ? {
                bg: ' myGray.22 !important',
                color: 'black.30 !important ',
                border: '1px solid',
                borderColor: 'primary.1',
                cursor: 'default'
              }
            : {
                cursor: 'pointer',
                color: 'myGray.600'
              })}
          _hover={{
            color: 'black.30',
            bg: 'myGray.22'
          }}
          onClick={() => {
            if (value === item.value) return;
            onChange(item.value);
          }}
        >
          <MyIcon
            {...(value === item.value
              ? {
                  color: 'primary.10'
                }
              : {
                  color: 'black.30'
                })}
            mr={2}
            name={item.icon as IconNameType}
            w={'16px'}
          />
          {item.label}
        </Flex>
      ))}
    </Box>
  );
};

export default SideTabs;
