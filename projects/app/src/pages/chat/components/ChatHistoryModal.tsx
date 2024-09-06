import React, { useState,useEffect } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Flex,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Text,
    Spacer,
} from '@chakra-ui/react';
import { DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { ChatHistoryItemType } from '@fastgpt/global/core/chat/type';
import dayjs from 'dayjs';
interface ChatHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    histories:ChatHistoryItemType[];
    batchDeleterHistories?: (e: { chatIds: string[] }) => void;
    isLoading:boolean,
    onDelHistory: (e: { chatId: string }) => void;
}


const ChatHistoryModal: React.FC<ChatHistoryModalProps> = (
    { isOpen, 
        onClose,
        histories,
        batchDeleterHistories,
        isLoading,
        onDelHistory
     }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [searchKey, setSearchKey] = useState<string>('');
    const [currentChatId, setCurrentChatId] = useState<string>('');

    const [filterHistories, setFilterHistories] = useState<ChatHistoryItemType[]>(histories);


    //监听histories变化, 更新loading状态
    useEffect(() => {
        setFilterHistories(histories)
    }, [histories,isLoading])

    const handleSelectItem = (chatId: string) => {
        setSelectedItems(prev =>
            prev.includes(chatId) ? prev.filter(item => item !== chatId) : [...prev, chatId]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === histories.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(histories.map(item => item.chatId));
        }
    };

    const handleDeleteSelected = () => {
        //删除选中历史数据
        if(batchDeleterHistories){
            batchDeleterHistories({chatIds:selectedItems})
        }
        //这里可以添加删除逻辑
        setSelectedItems([]);
    };

    const handleSearchKeyChange = (value:string) => {
        if(value){
            const tempHistories = histories.filter(item => (item.customTitle||item.title).includes(value))
            setFilterHistories(tempHistories)
        }else{
            setFilterHistories(histories)
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size={'2xl'}  >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Flex justifyContent="space-between" alignItems="center">
                            <Text fontSize={'16px'}>管理对话记录，共{histories.length}条</Text>
                            <InputGroup width="300px" mr={6} >
                                <InputLeftElement pointerEvents="none">
                                    <SearchIcon color="gray.300" />
                                </InputLeftElement>
                                <Input 
                                value={searchKey}
                                placeholder="搜索历史记录" 
                                height={'36px'} 
                                onChange={(e) => {
                                    setSearchKey(e.target.value)
                                    handleSearchKeyChange(e.target.value)
                                }} 
                                />
                            </InputGroup>
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <TableContainer fontSize={'sm'} h={'400px'} overflowY={'auto'}>
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>
                                            <Checkbox
                                                isChecked={selectedItems.length === histories.length}
                                                onChange={handleSelectAll}
                                            />
                                        </Th>
                                        <Th>对话名称</Th>
                                        <Th>发起对话时间</Th>
                                        <Th>操作</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filterHistories.map(item => (
                                        <Tr key={item.chatId} bg={selectedItems.includes(item.chatId) ? 'pink.50' : 'white'}>
                                            <Td width={'40px'}>
                                                <Checkbox
                                                    isChecked={selectedItems.includes(item.chatId)}
                                                    onChange={() => handleSelectItem(item.chatId)}
                                                />
                                            </Td>
                                            <Td maxW={'200px'} className="textEllipsis">{item.title}</Td>
                                            <Td>{dayjs(item.updateTime).format('YYYY/MM/DD HH:mm')}</Td>
                                            <Td>
                                                <Button
                                                    isLoading={isLoading&&currentChatId===item.chatId}
                                                    aria-label="Delete"
                                                    leftIcon={<DeleteIcon  color={'black.30'}/>}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setCurrentChatId(item.chatId);
                                                        onDelHistory({chatId:item.chatId})
                                                    }}
                                                />
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Flex w="100%" alignItems="center">
                            <Checkbox
                               fontSize={'sm'}
                                ml={7}
                                isChecked={selectedItems.length === histories.length}
                                onChange={handleSelectAll}
                            >全选</Checkbox>
                            <Spacer />
                            <Button variant="ghost" onClick={onClose}>
                                取消
                            </Button>
                            <Button isLoading={isLoading} colorScheme="pink" ml={3} onClick={handleDeleteSelected}>
                                删除所选
                            </Button>
                        </Flex>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ChatHistoryModal;