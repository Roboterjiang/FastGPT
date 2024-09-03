import React, { useMemo } from 'react';
import { Box, Flex, Grid, Image, Button } from '@chakra-ui/react';
import type { FlexProps, GridProps } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import MyIcon from '../Icon';

type Props<ValueType = string> = Omit<GridProps, 'onChange'> & {
  list: { icon?: string; label: string | React.ReactNode; value: ValueType }[];
  value: ValueType;
  size?: 'sm' | 'md' | 'lg';
  inlineStyles?: FlexProps;
  onChange: (value: ValueType) => void;
};

const ButtonTabs = <ValueType = string,>({
  list,
  size = 'md',
  value,
  onChange,
  inlineStyles,
  ...props
}: Props<ValueType>) => {
  const { t } = useTranslation();
  const sizeMap = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          fontSize: 'xs',
          outP: '3px',
          inlineP: 1
        };
      case 'md':
        return {
          fontSize: 'sm',
          outP: '4px',
          inlineP: 1
        };
      case 'lg':
        return {
          fontSize: ['sm', 'md'],
          outP: '5px',
          inlineP: 2
        };
    }
  }, [size]);

  return (
    <Grid
      gridTemplateColumns={`repeat(${list.length},1fr)`}
      p={sizeMap.outP}
      borderRadius={'sm'}
      fontSize={sizeMap.fontSize}
      overflowX={'auto'}
      {...props}
    >
      {list.map((item) => (
        <Flex
          key={item.value as string}
          py={sizeMap.inlineP}
          alignItems={'center'}
          justifyContent={'left'}
          borderBottom={'2px solid transparent'}
          px={3}
          whiteSpace={'nowrap'}
          {...inlineStyles}
          onClick={() => {
            if (value === item.value) return;
            onChange(item.value);
          }}
        >
          <Button
            variant={value === item.value ? 'primaryOutline' : 'grayBase'}
            {...(value === item.value
              ? {
                  cursor: 'default'
                  // fontWeight: 'bold',
                }
              : {
                  cursor: 'pointer'
                })}
          >
            {typeof item.label === 'string' ? t(item.label) : item.label}
          </Button>
          {/* {item.icon && (
            <>
              {item.icon.startsWith('/') ? (
                <Image mr={1} src={item.icon} alt={''} w={'16px'} />
              ) : (
                <MyIcon mr={1} name={item.icon as any} w={'16px'} />
              )}
            </>
          )}
          {typeof item.label === 'string' ? t(item.label) : item.label} */}
        </Flex>
      ))}
    </Grid>
  );
};

export default ButtonTabs;
