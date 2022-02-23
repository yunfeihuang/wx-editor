<template>
  <div class="wx-editor">
    <div
      class="wx-editor--inner"
      :class="{'is-show-word-limit': showWordLimit}"
      :placeholder="placeholder"
      ref="editor"
      contenteditable
      @keydown="handleKeydown"
      @keypress="handleKeypress"
      @keyup="handleKeyup"
      @focus="handleFocus"
      @click="handleFocus"
      @paste="handlePaste"></div>
    <div class="wx-editor--count" v-if="showWordLimit">
      <span>{{modelValue ? modelValue.length : 0}}</span>
      <span v-if="maxlength">{{maxlength}}</span>
    </div>
    <teleport to="body">
      <div ref="autocomplete" class="wx-editor--autocomplete" v-if="option.length" :style="optionStyle">
        <div
          class="wx-editor--autocomplete-option"
          v-for="(item,index) in option"
          :key="index"
          :class="{'is-active': active == index}"
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
let charStartOffset = null
let keyword = null

export default {
  name: 'WxEditor',
  props: {
    modelValue: {
      type: String
    },
    placeholder: {
      type: String,
      default: '请输入'
    },
    maxlength: {
      type: Number
    },
    disabled: {
      type: Boolean
    },
    showWordLimit: {
      type: Boolean
    },
    emoticon: {
      type: Array
    },
    keyword: {
      type: Array,
      default () {
        return ['@']
      }
    },
    keywordChange: {
      type: Function
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
      if (this.emoticon) {
        this.emoticon.forEach(item => {
          value = value.replaceAll(item[0], `<img src="${item[1]}" title="${item[0]}"/>`)
        })
      }
      return value
    },
    insertHTML (html) {
      //Selection 对象，表示用户选择的文本范围或光标的当前位置。
      //在非IE浏览器（Firefox、Safari、Chrome、Opera）下可以使用window.getSelection()获得selection对象
      //anchor 选中区域的“起点”。
      //focus 选中区域的“结束点”。
      //range 是一种fragment(HTML片断)，它包含了节点或文本节点的一部分。一般情况下，同一时刻页面中只可能有一个range，也有可能是多个range（使用Ctrl健进行多选，不过有的浏览器不允许，例如Chrome）。可以从selection中获得range对象，也可以使用document.createRange()方法获得。
      if (!sel) {
        // sel = window.getSelection()
      }
      // console.log('rangerangerange', range)
      if (range) {
        //getRangeAt(index) 从当前selection对象中获得一个range对象。
        //deleteContents()方法,range内容会被删除
        range.deleteContents()
        //将输入的内容写入并加载到 dom 中
        let el = document.createElement("div")
        el.innerHTML = html
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
      if (this.keywordChange && data) {
        this.keywordChange(data).then(res => {
          let rect = window.getSelection().getRangeAt(0).getClientRects()[0]
          if (rect) {
            this.optionStyle = {
              top: rect.top + rect.height + 'px',
              left: rect.left + 'px'
            }
          }
          this.option = res
          this.active = -1
        })
      }
    },
    handleSelectOption (value) {
      if (value) {
        value = `${value}&nbsp;` // eslint-disable-line
        keyword && commonAncestorContainer.replaceData(charStartOffset, keyword.length, '')
        this.insertHTML(value)
      }
      this.option = []
      charStartOffset = keyword = null
      this.active = -1
    },
    handleFocus () {
      sel = window.getSelection()
      range = sel.getRangeAt(0)
      this.handleSelectOption()
    },
    handleKeydown (e) {
      let scrollIntoView = () => {
        this.$nextTick(() => {
          if (this.$refs.autocomplete) {
            let node = this.$refs.autocomplete.querySelector('.is-active')
            node && node.scrollIntoView(false)
          }
        })
      }
      if (charStartOffset) {
        if (e.keyCode === 40) {
          e.preventDefault()
          this.active = this.active < this.option.length - 1 ? this.active + 1 : 0
          // console.log('this.active', this.active)
          scrollIntoView()
        } else if (e.keyCode === 38) {
          e.preventDefault()
          this.active = this.active == 0 ? this.option.length - 1 : this.active - 1
          scrollIntoView()
        } else if (e.keyCode == 13) {
          e.preventDefault()
          this.option[this.active] && this.handleSelectOption(this.option[this.active].value)
        }
      }
    },
    handleKeypress () {
      requestAnimationFrame(() => {
        sel = window.getSelection()
        range = sel.getRangeAt(0)
        commonAncestorContainer = range.commonAncestorContainer
        const nodeValue = range.commonAncestorContainer.nodeValue || range.commonAncestorContainer.innerText
        const inputChar = nodeValue.charAt(range.startOffset - 1)
        // console.log('inputChar', nodeValue, inputChar)
        if (this.keyword.includes(inputChar)) {
          charStartOffset = range.startOffset
          keyword = inputChar
          this.handleKeyword([keyword.substring(0, 1), ''])
        } else if (keyword) {
          keyword = keyword + inputChar
          this.handleKeyword([keyword.substring(0, 1), keyword.substring(1, keyword.length)])
        }
      })
    },
    handleKeyup () {
      let range = window.getSelection().getRangeAt(0)
      if (charStartOffset && range.startOffset >=  charStartOffset - 1) {
        const nodeValue = range.commonAncestorContainer.nodeValue || range.commonAncestorContainer.innerText
        let _keyword = nodeValue.substring(charStartOffset - 1, range.startOffset)
        if (_keyword !== keyword) {
          keyword = _keyword
          this.handleKeyword([keyword.charAt[0], keyword.substring(1, keyword.length)])
        }
      } else {
        this.handleSelectOption()
      }
      this.handleChange()
    },
    handlePaste (e) {
      e.preventDefault()
      document.execCommand("insertText", false, e.clipboardData.getData('text/plain'))
    }
  }
}
</script>
<style lang="scss">
  .wx-editor{
    background:#fff;
    position: relative;
    text-align: left;
    &--inner{
      outline: none;
      overflow: auto;
      padding: 5px;
      min-height:20px;
      word-break: break-all;
      border:1px solid #eee;
      &.is-show-word-limit{
        padding-bottom: 30px;
      }
      img{
        width:20px;
        height:20px;
      }
      &:empty{
        &:before{
          content: attr(placeholder);
          color:#999;
        }
      }
      &:focus{
        &:before{
          display: none;
        }
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