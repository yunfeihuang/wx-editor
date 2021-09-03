<template>
  <div class="vx-editor">
    <div class="vx-editor--toolbar">
      <div class="vx-editor--action" @click="insertHTML()">表情</div>
    </div>
    <div
      class="vx-editor--inner"
      ref="editor"
      contenteditable
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @blur="handleBlur"
      @paste="handlePaste"></div>
    <div class="vx-editor--count">
      <span>{{modelValue ? modelValue.length : 0}}</span>
      <span v-if="maxlength">{{maxlength}}</span>
    </div>
    <teleport to="body">
      <div ref="autocomplete" class="vx-editor--autocomplete" v-if="option.length" :style="optionStyle">
        <div
          class="vx-editor--autocomplete-option"
          v-for="(item,index) in option"
          :key="index" :class="{'is-active': active == index}"
          v-html="item.label"
          @mousedown.prevent="handleSelectOption(item.value)"></div>
      </div>
    </teleport>
  </div>
</template>

<script>
let range = null
let sel = null
let commonAncestorContainer = null
let nodeValue = null
let charStartOffset = null
let keywordChar = null
let keyword = null

export default {
  name: 'VxEditor',
  props: {
    modelValue: {
      type: String
    },
    maxlength: {
      type: Number
    },
    disabled: {
      type: Boolean
    },
    emoticon: {
      type: Array,
      default () {
        return [
          ['[微笑]', '/emoticon/laugh.png']
        ]
      }
    },
    keyword: {
      type: Array,
      default () {
        return ['@']
      }
    },
    onKeyword: {
      type: Function,
      default (value) {
        let result = [
          {value: 'aa', label: 'aa'},
          {value: 'bb', label: 'bb'},
          {value: 'cc', label: 'cc'},
          {value: 'dd', label: 'dd'}
        ]
        if (value[1]) {
          result = result.filter(item => item.value.includes(value[1]))
        }
        return Promise.resolve(result)
      }
    }
  },
  data () {
    return {
      active: -1,
      option: [],
      optionStyle: {top: 0, left: 0}
    }
  },
  mounted () {
    if (this.modelValue) {
      this.$refs.editor.innerHTML = this.parseValue(this.modelValue)
    }
  },
  methods: {
    transformValue (value) {
      let node = document.createElement('div')
      node.innerHTML = value
      Array.from(node.querySelectorAll('img[title]')).forEach(node => {
        node.outerHTML = node.title
      })
      return node.innerText
    },
    parseValue (value) {
      value = value.replaceAll('\n', '<br/>')
      this.emoticon.forEach(item => {
        value = value.replaceAll(item[0], `<img src="${item[1]}" title="${item[0]}"/>`)
      })
      return value
    },
    insertHTML (html = '<img src="/face/laugh.png" title="[微笑]"/>') {
      //Selection 对象，表示用户选择的文本范围或光标的当前位置。
      //在非IE浏览器（Firefox、Safari、Chrome、Opera）下可以使用window.getSelection()获得selection对象
      //anchor 选中区域的“起点”。
      //focus 选中区域的“结束点”。
      //range 是一种fragment(HTML片断)，它包含了节点或文本节点的一部分。一般情况下，同一时刻页面中只可能有一个range，也有可能是多个range（使用Ctrl健进行多选，不过有的浏览器不允许，例如Chrome）。可以从selection中获得range对象，也可以使用document.createRange()方法获得。
      if (range) {
        //getRangeAt(index) 从当前selection对象中获得一个range对象。
        //deleteContents()方法,range内容会被删除
        range.deleteContents()
        //将输入的内容写入并加载到 dom 中
        let el = document.createElement("div")
        el.innerHTML = html;
        let frag = document.createDocumentFragment(), node, lastNode
        while ( (node = el.firstChild) ) {
          lastNode = frag.appendChild(node)
        }
        //insertNode,在range的开始位置插入一 个节点
        range.insertNode(frag)
        //收尾
        if (lastNode) {
          range = range.cloneRange()
          range.setStartAfter(lastNode)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
        }
      } else {
        this.$refs.editor.innerHTML = this.$refs.editor.innerHTML + html
      }
      this.handleChange()
    },
    handleChange () {
      let value = this.transformValue(this.$refs.editor.innerHTML)
      // console.log('value', value)
      if (value !== this.modelValue) {
        this.$emit('update:modelValue', value)
      }
    },
    handleKeyword (data) {
      if (this.onKeyword && data) {
        keyword = data[1]
        this.onKeyword(data).then(res => {
          let rect = window.getSelection().getRangeAt(0).getClientRects()[0]
          this.optionStyle = {
            top: rect.top + rect.height + 'px',
            left: rect.left + 'px'
          }
          this.option = res
        })
      }
    },
    handleSelectOption (value) {
      if (value) {
        value = `${value} `
        commonAncestorContainer.replaceData(charStartOffset, keyword.length, value)
        window.getSelection().collapse(commonAncestorContainer, charStartOffset + value.length)
      }
      this.option = []
      charStartOffset = keywordChar = null
      this.active = -1
    },
    handleBlur () {
      sel = window.getSelection()
      range = sel.getRangeAt(0)
    },
    handleKeydown (e) {
      range = window.getSelection().getRangeAt(0)
      console.log('range', range)
      commonAncestorContainer = range.commonAncestorContainer
      nodeValue = commonAncestorContainer.nodeValue
      let scrollIntoView = () => {
        this.$nextTick(() => {
          let node = this.$refs.autocomplete.querySelector('.is-active')
          node && node.scrollIntoView(false)
        })
      }
      if (charStartOffset) {
        if (e.keyCode === 40) {
            e.preventDefault()
            this.active = this.active < this.option.length - 1 ? this.active + 1 : 0
            scrollIntoView()
        } else if (e.keyCode === 38) {
            e.preventDefault()
            this.active = this.active == 0 ? this.option.length - 1 : this.active - 1
            scrollIntoView()
        } else if (e.keyCode == 13) {
            e.preventDefault()
            this.handleSelectOption(this.option[this.active].value)
        }
      }
    },
    handleKeyup () {
      this.handleChange()
      let range = window.getSelection().getRangeAt(0)
      let currentNodeValue= range.commonAncestorContainer.nodeValue
      if (currentNodeValue) {
        let inputChar = currentNodeValue.charAt(range.startOffset - 1)
        if (inputChar && (nodeValue || '').length < currentNodeValue.length && this.keyword.includes(inputChar)) {
          charStartOffset = range.startOffset
          keywordChar = inputChar
          this.handleKeyword([keywordChar, ''])
        }
      }
      if (charStartOffset) {
        if (range.startOffset > charStartOffset) {
          this.handleKeyword([keywordChar, currentNodeValue.substring(charStartOffset, range.startOffset)])
        } else if (range.startOffset < charStartOffset) {
          this.handleSelectOption()
        }
      }
    },
    handlePaste (e) {
      e.preventDefault()
      document.execCommand("insertText", false, e.clipboardData.getData('text/plain'))
    }
  }
}
</script>
<style lang="scss">
  .vx-editor{
    background:#fff;
    position: relative;
    text-align: left;
    &--inner{
      height:100px;
      outline: none;
      overflow: auto;
      padding: 5px;
      padding-bottom: 30px;
      img{
        width:30px;
        height:30px;
        vertical-align: middle;
      }
    }
    &--autocomplete{
      position: fixed;
      background: #fff;
      min-width: 100px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      padding: 5px 0;
      max-height: 400px;
      overflow: auto;
      z-index: 10;
      &-option{
        line-height:32px;
        padding:0 10px;
        cursor: pointer;
        &.is-active{
            background:#eee;
        }
      }
    }
    &--count{
      position: absolute;
      right:0;
      bottom:0px;
      margin:8px;
      font-size: 12px;
      line-height: 1;
      span{
        &:last-child{
          &:before{
            content: '/';
            margin: 0 2px;
          }
        }
      }
    }
  }
</style>