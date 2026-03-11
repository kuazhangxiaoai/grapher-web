// store/useRouteStore.ts
import { defineStore } from 'pinia'
import type {Mark} from "@/configs/text";

export const useTextStore = defineStore('textStore', {
    state: () => ({
        totalPages: 1 as number, // 文档页数
        currentPage: 1 as number, //当前页
        articleId: null as string,
        articleName: null as string,
        topicId: null as string,
        topicName: null as string,
        domainId: null as string,
        domainName: null as string,
        markList: JSON.parse(localStorage.getItem('markInfo') || '[]') as Mark[],
    }),
    actions: {
        setTotalPages(totalPages: number) {
            this.totalPages = totalPages;
        },
        setCurrentPage(page: number) {
            this.currentPage = page;
        },
        previousPage(){
            this.currentPage--;
            this.savePageInfo();
        },
        nextPage(){
            this.currentPage++;
            this.savePageInfo();
        },
        jumpPage(pageIndex: number){
            this.currentPage = pageIndex;
            this.savePageInfo();
        },
        savePageInfo(){
            localStorage.setItem("markInfo", JSON.stringify(this.markList));
        },
        setMark(mark: Mark){
            this.markList = [mark];
        },
        addMark(mark: Mark){
            this.markList.push(mark);
            this.savePageInfo();
        },
        setMarkList(markList: Mark[]){
            this.markList = markList;
            this.savePageInfo();
        },
        setArticleId(articleId: string){
            this.articleId = articleId;
        },
        clearMarkList(){
            this.markList = [];
            this.savePageInfo();
        },
        getMarkList(){
            return this.markList;
        },
    },
})
