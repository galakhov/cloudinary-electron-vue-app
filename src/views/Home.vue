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

    <v-toolbar color="cyan" dark>
      <!-- <v-toolbar-side-icon></v-toolbar-side-icon> -->

      <v-toolbar-title class="justify-center"
        >Cloudinary Uploader</v-toolbar-title
      >

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>fa fa-search</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>fa fa-ellipsis-h</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card flat class="mb-3">
      <v-card-text>
        <v-spacer></v-spacer>
        <!--<v-c-uploader v-model="text" upload-preset="tm4w6luq" cloud-name="rootless"></v-c-uploader>-->
        <v-flex text-center
          ><uppy-cloudinary-uploader
            @uploaded="uploadCompleted"
            preset="tm4w6luq"
            cloudName="rootless"
          ></uppy-cloudinary-uploader
        ></v-flex>
      </v-card-text>
    </v-card>
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
  methods: {
    uploadCompleted(data: string) {
      console.log(data);
    }
  },
  computed: {
    // cloudinarySync() {
    //   return myUploadWidget();
    // }
  }
};
</script>
