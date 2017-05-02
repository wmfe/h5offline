<template>
  <div class="hello">
    <h1>{{ msgs }}</h1>
  </div>
</template>

<script>
export default {
  name: 'hello',
  data () {
    return {
      msgs: 'Welcome to Your Offline App.'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 {
  font-weight: normal;
}
</style>
