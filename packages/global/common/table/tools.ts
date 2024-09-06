/**
 * 
 * @param index 
 * @param isChecked 是否被选中
 * @param exchange 奇和耦是否互换
 * @returns 
 */
export const getTableBgColor = (index:number,isChecked: boolean,exchange?:boolean):string => {
    if(isChecked){
        return 'primary.005'
    }
    return (index % 2) === 0&&!exchange ? 'white':'myGray.23';
}

