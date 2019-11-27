import Vue from "vue";
import Cloudinary, {
  CldImage,
  CldTransformation,
  CldContext
} from "cloudinary-vue";

Vue.use(Cloudinary, {
  configuration: { cloudName: "rootless" },
  components: [CldImage, CldTransformation, CldContext]
});
