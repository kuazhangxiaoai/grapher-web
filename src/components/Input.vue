<template>
  <div 
    class="input-wrapper"
    :class="{
      'disabled': disabled,
      'focused': focused,
      'simple': simple,
      'has-error': hasError,
      'has-value': !!value
    }"
  >
    <span class="input-prefix" v-if="$slots.prefix">
      <slot name="prefix"></slot>
    </span>
    <input
      ref="inputRef"
      :disabled="disabled"
      :value="value" 
      :placeholder="placeholder"
      :maxlength="maxlength"
      :type="passwordType"
      class="input-field"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @change="$event => emit('change', $event)"
      @keydown.enter="$event => emit('enter', $event)"
      @keydown.backspace="$event => emit('backspace', $event)"
    />
    <!-- <span class="input-suffix" v-if="$slots.suffix || type === 'password'">
      <slot name="suffix"></slot>
      <button 
        v-if="type === 'password'" 
        type="button" 
        class="password-toggle"
        @click="togglePasswordVisibility"
        :disabled="disabled"
        aria-label="Toggle password visibility"
      >
        <svg v-if="showPassword" class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <svg v-else class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      </button>
    </span>
    <div class="input-highlight"></div> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  value: string
  disabled?: boolean
  placeholder?: string
  simple?: boolean
  maxlength?: number
  showPassword?: boolean
  type?: string
  hasError?: boolean
}>(), {
  disabled: false,
  placeholder: '',
  simple: false,
  showPassword: false,
  type: 'text',
  hasError: false
})

const emit = defineEmits<{
  (event: 'update:value', payload: string): void
  (event: 'input', payload: Event): void
  (event: 'change', payload: Event): void
  (event: 'blur', payload: Event): void
  (event: 'focus', payload: Event): void
  (event: 'enter', payload: Event): void
  (event: 'backspace', payload: Event): void
  (event: 'update:showPassword', payload: boolean): void
}>()

const focused = ref(false)
const localShowPassword = ref(props.showPassword)

const passwordType = computed(() => {
  if (props.type !== 'password') return props.type
  return localShowPassword.value ? 'text' : 'password'
})

const togglePasswordVisibility = () => {
  localShowPassword.value = !localShowPassword.value
  emit('update:showPassword', localShowPassword.value)
}

const handleInput = (e: Event) => {
  emit('update:value', (e.target as HTMLInputElement).value)
  emit('input', e)
}

const handleBlur = (e: Event) => {
  focused.value = false
  emit('blur', e)
}

const handleFocus = (e: Event) => {
  focused.value = true
  emit('focus', e)
}

const inputRef = ref<HTMLInputElement>()
const focus = () => {
  if (inputRef.value) inputRef.value.focus()
}

defineExpose({
  focus,
})
</script>

<style lang="scss" scoped>
.input-wrapper {
  background-color: #fff;
  border: 2px solid #e1e4e8;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  margin-bottom: 0.25rem;
  
  &:not(.disabled):hover {
    border-color: rgba(255, 90, 52, 0.5);
    
    .input-highlight {
      opacity: 0.1;
    }
  }
  
  &.focused {
    border-color: #ff5a34;
    box-shadow: 0 0 0 3px rgba(255, 90, 52, 0.15);
    
    .input-highlight {
      opacity: 0.15;
    }
  }
  
  &.disabled {
    background-color: #f5f5f5;
    border-color: #e1e4e8;
    color: #b7b7b7;
    cursor: not-allowed;
    
    .input-field {
      color: #b7b7b7;
      cursor: not-allowed;
    }
  }
  
  &.simple {
    border-width: 0 0 2px 0;
    border-radius: 0;
    background-color: transparent;
  }
  
  &.has-error {
    border-color: #e74c3c;
    
    &.focused {
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
    }
  }
  
  .input-highlight {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 0;
    width: 100%;
    background: linear-gradient(90deg, #ff5a34, #ff7857);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 0;
  }
}

.input-field {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  color: #2c3e50;
  font-family: 'Poppins', sans-serif;
  position: relative;
  z-index: 1;
  
  &::placeholder {
    color: #9ca3af;
    transition: color 0.3s ease;
  }
  
  &:focus::placeholder {
    color: #d1d5db;
  }
}

.input-prefix, .input-suffix {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #6c757d;
  z-index: 1;
}

.password-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #6c757d;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    color: #ff5a34;
  }
  
  &:disabled {
    cursor: not-allowed;
    color: #b7b7b7;
  }
  
  .eye-icon {
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.1);
    }
  }
}

// Animation for autofill
@keyframes autofill {
  0%, 100% {
    background-color: rgba(255, 90, 52, 0.05);
  }
}

input:-webkit-autofill {
  animation-name: autofill;
  animation-fill-mode: both;
  -webkit-text-fill-color: #2c3e50;
  -webkit-box-shadow: 0 0 0px 1000px rgba(255, 90, 52, 0.05) inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>