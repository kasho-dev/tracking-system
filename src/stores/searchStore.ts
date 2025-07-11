import { defineStore } from "pinia";

export const useSearchStore = defineStore("search", {
  state: () => ({
    searchQuery: "",
  }),
  actions: {
    setSearchQuery(query: string) {
      this.searchQuery = query;
    },
  },
});
