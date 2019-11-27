<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png" /> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->

    <!-- <button
      @click="cloudinarySync"
      id="upload_widget"
      class="cloudinary-button"
    >
      Upload files
    </button>-->

    <uppy-cloudinary-uploader @uploaded="uploadCompleted" preset="tm4w6luq" cloudName="rootless"></uppy-cloudinary-uploader>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
// import { Vue, Component, Emit, Prop, Watch } from "vue-property-decorator";
import UppyCloudinaryUploader from "@/components/Uppy/UppyCloudinaryUploader.vue";
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "home",
  components: {
    // HelloWorld
    UppyCloudinaryUploader
  },
  computed: {
    // cloudinarySync() {
    //   return myUploadWidget();
    // }
  }
};
</script>
