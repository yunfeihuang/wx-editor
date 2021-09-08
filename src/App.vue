<template>
  <WxEditor ref="editor" v-model="value" :maxlength="100"/>
  <div class="test">
    <span @mousedown.prevent="$refs.editor.insertHTML(`<img src='/gif/e100.gif' title='[微笑]'/>`)">表情</span>
    <span @click="$refs.editor.insertHTML('@张三&nbsp;')">@用户</span>
    <span @click="$refs.editor.insertHTML('#人民的名义#')">#话题</span>
  </div>
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

<style lang="scss">
#app {
  .test{
    font-size: 12px;
    margin-top:10px;
    span{
      margin:0 5px;
    }
  }
}
</style>
