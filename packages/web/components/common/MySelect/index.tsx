import React, { useRef, forwardRef, useMemo } from 'react';
import {
  Menu,
  MenuList,
  MenuItem,
  Button,
  useDisclosure,
  MenuButton,
  Box,
  css,
  Flex
} from '@chakra-ui/react';
import type { ButtonProps, MenuItemProps } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useLoading } from '../../../hooks/useLoading';
import MyIcon from '../Icon';

export type SelectProps = ButtonProps & {
  value?: string | number;
  placeholder?: string;
  list: {
    alias?: string;
    label: string | React.ReactNode;
    description?: string;
    value: string | number;
  }[];
  isLoading?: boolean;
  onchange?: (val: any) => void;
};

const MySelect = (
  {
    placeholder,
    value,
    width = '100%',
    list = [],
    onchange,
    isLoading = false,
    ...props
  }: SelectProps,
  selectRef: any
) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { Loading } = useLoading();
  const menuItemStyles: MenuItemProps = {
    display: 'flex',
    alignItems: 'center',
    _hover: {
      backgroundColor: 'primary.60',
      borderLeftColor: 'primary.10',
      borderLeftWidth: '5px'
    },
    _notLast: {
      mb: 2
    }
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const selectItem = useMemo(() => list.find((item) => item.value === value), [list, value]);

  return (
    <Box
      css={css({
        '& div': {
          width: 'auto !important'
        }
      })}
    >
      <Menu
        autoSelect={false}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        strategy={'fixed'}
        matchWidth
      >
        <MenuButton
          as={Button}
          ref={ref}
          width={width}
          px={3}
          rightIcon={<ChevronDownIcon />}
          variant={'whitePrimary'}
          textAlign={'left'}
          _active={{
            transform: 'none'
          }}
          {...(isOpen
            ? {
                boxShadow: '0px 0px 4px #A8DBFF',
                borderColor: 'primary.500'
              }
            : {})}
          {...props}
        >
          <Flex alignItems={'center'}>
            {isLoading && <MyIcon mr={2} name={'common/loading'} w={'16px'} />}
            {selectItem?.alias || selectItem?.label || placeholder}
          </Flex>
        </MenuButton>

        <MenuList
          className={props.className}
          minW={(() => {
            const w = ref.current?.clientWidth;
            if (w) {
              return `${w}px !important`;
            }
            return Array.isArray(width)
              ? width.map((item) => `${item} !important`)
              : `${width} !important`;
          })()}
          w={'auto'}
          borderLeft={'2px solid primary.10'}
          boxShadow={
            '0px 2px 4px rgba(161, 167, 179, 0.25), 0px 0px 1px rgba(121, 141, 159, 0.25);'
          }
          zIndex={99}
          maxH={'40vh'}
          overflowY={'auto'}
        >
          {list.map((item) => (
            <MenuItem
              key={item.value}
              {...menuItemStyles}
              {...(value === item.value
                ? {
                    color: 'myGray.900',
                    bg: 'primary.60',
                    borderLeftColor: 'primary.10',
                    borderLeftWidth: '5px'
                  }
                : {
                    color: 'myGray.900',
                    bg: 'myWhite.100'
                  })}
              onClick={() => {
                if (onchange && value !== item.value) {
                  onchange(item.value);
                }
              }}
              whiteSpace={'pre-wrap'}
              fontSize={'sm'}
              display={'block'}
            >
              <Box>{item.label}</Box>
              {item.description && (
                <Box color={'myGray.500'} fontSize={'xs'}>
                  {item.description}
                </Box>
              )}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default React.memo(forwardRef(MySelect));
