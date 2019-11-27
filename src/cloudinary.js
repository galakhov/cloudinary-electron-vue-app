import Vue from "vue";
import cloudinary_core from "cloudinary-core";
// import cloudinary from "./widget.cloudinary"; // cloudinary
import Cloudinary, {
  CldImage,
  CldTransformation,
  CldContext
} from "cloudinary-vue";

Vue.use(Cloudinary, {
  configuration: { cloudName: "rootless" },
  components: [CldImage, CldTransformation, CldContext]
});

const cloudinaryCore = new cloudinary_core.Cloudinary({
  cloud_name: "rootless"
});

// export const myUploadWidget = cloudinary_core.createUploadWidget(
//   {
//     cloudName: "rootless",
//     uploadPreset: "tm4w6luq"
//   },
//   (error, result) => {
//     if (!error && result && result.event === "success") {
//       console.log("Done! Here is the image info: ", result.info);
//     }
//   }
// );

//...
// computed: {
//     cloudinarySrc() {
//       return cloudinaryCore.url('sample')
//     }
// }
