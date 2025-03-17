<script setup lang="ts">

import Vite from "../assets/vite.svg";
import Vue from "../assets/vue.svg";
import Button from 'primevue/button';



</script>

<template>
<body class="bg-[#0A0E1A] flex h-screen p-4">
<div class="w-64 bg-[#0A0E1A] text-white">

  <button class="w-full flex items-center justify-center gap-2 bg-[#6A5CFE] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#7C6CFF] transition">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13.234 20.252 21 12.3"/>
        <path d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"/>
    </svg>
    Add PO Number
</button>
<!--test-->

  <div class="mt-4 space-y-2">
            <!-- Completed -->
            <div class="flex items-center justify-between bg-[#2E3347] text-green-400 font-semibold px-4 py-3 rounded-lg">
                <span class="flex items-center gap-2">
                    ✅ Completed
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Pending -->
            <div class="flex items-center justify-between text-purple-400 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    ⏳ Pending
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Lapsed -->
            <div class="flex items-center justify-between text-yellow-400 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    📄<span class="relative">
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">!</span>
                    </span> Lapsed
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Needs Action -->
            <div class="flex items-center justify-between text-red-500 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    👤<span class="relative">
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">!</span>
                    </span> Needs action
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Documents -->
            <div class="flex items-center justify-between text-purple-400 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    📁 Documents <span class="text-red-500">🔔</span>
                </span>
                <span class="text-white">0</span>
            </div>

    </div>
  </div>



</body>
</template>


<style scoped>

</style>