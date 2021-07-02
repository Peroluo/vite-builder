<template>
  <h1> {{ msg }} </h1>
</template>

<script>
import { reactive, toRefs } from 'vue';
export default {
    setup() {
        const state = reactive({
            msg: 'vite222'
        });
        return {
            ...toRefs(state),
        };
    }
};
</script>
