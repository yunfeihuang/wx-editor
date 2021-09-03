<template>
  <WxEditor v-model="value" :maxlength="100"/>
</template>

<script>
import WxEditor from '../packages/index.vue'

export default {
  name: 'App',
  components: {
    WxEditor
  },
  data () {
    return {
      value: ''
    }
  }
}
</script>

<style>
#app {
}
</style>
