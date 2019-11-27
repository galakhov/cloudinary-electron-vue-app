<template>
  <v-app id="inspire">
    <v-content class="pa-5">
      <Home />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Home from "./views/Home.vue";

export default Vue.extend({
  name: "App",

  components: {
    Home
  },

  data: () => ({
    //
  })
});
</script>
