<template>
  富文本编辑器：<br/>
  <br/>
  <WxEditor ref="editor" :emoticon="emoticon" :keyword="keyword" :keywordChange="keywordChange" v-model="value"/>
  <div class="test">
    <span @mousedown.prevent="emoticonShow = true">表情</span>
    <span @click="$refs.editor.insertHTML('@张三&nbsp;')">@用户</span>
    <span @click="$refs.editor.insertHTML('#人民的名义#&nbsp;')">#话题</span>
    <div class="emoticon" v-if="emoticonShow" @click="emoticonShow=false">
      <img v-for="(item) in 20" :key="item" :src="'./gif/e100.gif'" title='[微笑]' @mousedown.prevent="$refs.editor.insertHTML(`<img src='./gif/e100.gif' title='[微笑]'/>`)"/>
    </div>
  </div>
  <br/>
  <br/>
  输入值：<br/>
  {{value}}
</template>

<script>
import 'wx-editor2/lib/index.css'
import WxEditor from 'wx-editor2'

export default {
  name: 'App',
  components: {
    WxEditor
  },
  data () {
    return {
      emoticonShow: false,
      value: '',
      keyword: ['@', '#'],
      emoticon: ['[微笑]', './gif/e100.gif']
    }
  },
  methods: {
    keywordChange (value) {
      console.log('keywordChange', value)
      let result = value[0] == '@' ? [
        {value: 'aa', label: 'aa'},
        {value: 'bb', label: 'bb'},
        {value: 'cc', label: 'cc'},
        {value: 'dd', label: 'dd'}
      ] : [
        {value: 'aa#', label: 'aa'},
        {value: 'bb#', label: 'bb'},
        {value: 'cc#', label: 'cc'},
        {value: 'dd#', label: 'dd'}
      ]
      if (value[1]) {
        result = result.filter(item => item.value.includes(value[1]))
      }
      return Promise.resolve(result)
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
  .emoticon{
    border:1px solid #eee;
    position:absolute;
    background:#fff;
    z-index:1;
    padding:10px;
    max-width:200px;
  }
}
</style>
