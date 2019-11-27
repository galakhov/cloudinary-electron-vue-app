<template>
  <button :class="[buttonStyle]" v-on:click="openUploader()">
    {{ buttonText }}
    <v-icon right dark>fas fa-cloud-upload-alt</v-icon>
  </button>
</template>

<style lang="scss">
// @import "@/../node_modules/@uppy/core/dist/style.css";
// @import "@/../node_modules/@uppy/dashboard/dist/style.css";
</style>

<script>
// import Uppy from 'uppy/lib/core';
import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import ProgressTimeout from "@uppy/utils/lib/ProgressTimeout";
import EventTracker from "@uppy/utils/lib/EventTracker";
import RateLimitedQueue from "@uppy/utils/lib/RateLimitedQueue";
import Dashboard from "@uppy/dashboard";
import ProgressBar from "@uppy/progress-bar";
import StatusBar from "@uppy/status-bar";
import Informer from "@uppy/informer";
import "@uppy/core/src/style.scss";
import "@uppy/dashboard/src/style.scss";
import "@uppy/progress-bar/src/style.scss";
import "@uppy/status-bar/src/style.scss";
import "@uppy/informer/src/style.scss";
import { log } from "util";
// import Webcam from '@uppy/webcam';

const BASE_URL = "https://api.cloudinary.com/v1_1/";
const IMAGE_POSTFIX = "/image/upload"; // /v1442506910
const VIDEO_POSTFIX = "/video/upload";
const uploaderEvents = Object.create(null);
const requests = new RateLimitedQueue(0);
const global_opts = {
  formData: true,
  fieldName: "files[]",
  method: "post",
  // metaFields: null,
  responseUrlFieldName: "url",
  bundle: false,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Access-Control-Allow-Origin": "*"
  },
  timeout: 30 * 1000,
  limit: 0,
  withCredentials: false,
  responseType: "",
  endpoint: `${BASE_URL}rootless${IMAGE_POSTFIX}`
};

function setTypeInBlob(file) {
  const dataWithUpdatedType = file.data.slice(
    0,
    file.data.size,
    file.meta.type
  );
  return dataWithUpdatedType;
}

function buildResponseError(xhr, error) {
  // No error message
  if (!error) error = new Error("Upload error");
  // Got an error message string
  if (typeof error === "string") error = new Error(error);
  // Got something else
  if (!(error instanceof Error)) {
    error = Object.assign(new Error("Upload error"), { data: error });
  }

  error.request = xhr;
  return error;
}

export default {
  props: {
    cloudName: {
      type: String,
      required: true
    },
    preset: {
      type: String,
      required: true
    },
    buttonText: {
      type: String,
      default: "Upload"
    },
    minNumberOfFiles: {
      type: Number,
      default: 1
    },
    maxNumberOfFiles: {
      type: Number,
      default: 10
    },
    maxFileSize: {
      type: Number,
      default: 40000000
    },
    allowedFileTypes: {
      type: Array,
      default() {
        return ["image/*", "video/*", "text/*"];
      }
    },
    tags: {
      type: Array,
      default() {
        return [];
      }
    },
    autoProceed: {
      type: Boolean,
      default: false
    },
    showProgressDetails: {
      type: Boolean,
      default: true
    },
    closeModalOnClickOutside: {
      type: Boolean,
      default: true
    },
    buttonStyle: {
      type: String,
      default: "uploader"
    }
  },
  methods: {
    // Opens the upload dialog
    openUploader() {
      this.uppy.getPlugin("Dashboard").openModal();
    },
    getOptions(file) {
      const overrides = this.uppy.getState().xhrUpload;
      const opts = {
        ...global_opts,
        ...(overrides || {}),
        ...(file.xhrUpload || {})
        // headers: {
        //   "X-CSRF-TOKEN": window.csrfToken
        // }
      };
      // Object.assign(opts.headers, this.opts.headers);
      // if (overrides) {
      //   Object.assign(opts.headers, overrides.headers);
      // }
      // if (file.xhrUpload) {
      //   Object.assign(opts.headers, file.xhrUpload.headers);
      // }

      return opts;
    },
    validateStatus(status, responseText, response) {
      console.log("validateStatus -> status", status);
      console.log("validateStatus -> responseText", responseText);
      console.log("validateStatus -> response", response);
      return status >= 200 && status < 300;
    },
    getResponseData(responseText, response) {
      console.log("getResponseData -> responseText", responseText);
      console.log("getResponseData -> response", response);

      let parsedResponse = {};
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (err) {
        console.log(err);
      }

      return parsedResponse;
    },
    getResponseError(responseText, response) {
      console.log("getResponseError -> responseText", responseText);
      console.log("getResponseError -> response", response);

      return new Error("Upload error");
    },
    createBareUpload(file, opts) {
      return file.data;
    },
    addMetadata(formData, meta, opts) {
      const metaFields = Array.isArray(opts.metaFields)
        ? opts.metaFields
        : // Send along all fields by default.
          Object.keys(meta);

      metaFields.forEach(item => {
        formData.append(item, meta[item]);
      });
    },
    // createFormDataUpload(file, opts) {
    //   const formPost = new FormData();

    //   this.addMetadata(formPost, file.meta, opts);

    //   const dataWithUpdatedType = setTypeInBlob(file);

    //   if (file.name) {
    //     formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name);
    //   } else {
    //     formPost.append(opts.fieldName, dataWithUpdatedType);
    //   }

    //   return formPost;
    // },
    onFileRemove(fileID, cb) {
      uploaderEvents[fileID].on("file-removed", file => {
        if (fileID === file.id) cb(file.id);
      });
    },
    onRetry(fileID, cb) {
      uploaderEvents[fileID].on("upload-retry", targetFileID => {
        if (fileID === targetFileID) {
          cb();
        }
      });
    },
    onRetryAll(fileID, cb) {
      uploaderEvents[fileID].on("retry-all", filesToRetry => {
        if (!this.uppy.getFile(fileID)) return;
        cb();
      });
    },
    onCancelAll(fileID, cb) {
      uploaderEvents[fileID].on("cancel-all", () => {
        if (!this.uppy.getFile(fileID)) return;
        cb();
      });
    },
    // Uploads a single file
    uploadFile(file) {
      console.log("file.meta", file.meta);

      // ----------------------------------------------------
      // This code below tracks the progress of an upload correctly, however responds with 400 after the uploading is finished for some reason:
      // ----------------------------------------------------
      // const opts = this.getOptions(file);
      // // console.log(`uploading ${current} of ${total}`);

      // // return new Promise((resolve, reject) => {
      // this.uppy.emit("upload-started", file);

      // // const data = opts.formData
      // //   ? this.createFormDataUpload(file, opts)
      // //   : this.createBareUpload(file, opts);
      // const formPost = new FormData();
      // this.addMetadata(formPost, file.meta, opts);
      // // formPost.append("file", file.data);
      // formPost.append("file", file.data);
      // formPost.append("upload_preset", this.preset);
      // formPost.append("tags", this.tags);

      // // const dataWithUpdatedType = setTypeInBlob(file);

      // // if (file.name) {
      // //   formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name);
      // // }
      // const formData = formPost; // this.createBareUpload(file, opts);
      // console.log("data: ", formData);

      // const xhr = new XMLHttpRequest();

      // const timer = new ProgressTimeout(opts.timeout, () => {
      //   xhr.abort();
      //   const error = new Error(
      //     this.i18n("timedOut", { seconds: Math.ceil(opts.timeout / 1000) })
      //   );
      //   this.uppy.emit("upload-error", file, error);
      //   console.error(error);
      //   // reject(error);
      // });

      // uploaderEvents[file.id] = new EventTracker(this.uppy);

      // // const id = cuid();

      // xhr.upload.addEventListener("loadstart", ev => {
      //   this.uppy.log(`[XHRUpload] started`);
      // });

      // xhr.upload.addEventListener("progress", ev => {
      //   this.uppy.log(`[XHRUpload] progress: ${ev.loaded} / ${ev.total}`);
      //   // Begin checking for timeouts when progress starts, instead of loading,
      //   // to avoid timing out requests on browser concurrency queue
      //   timer.progress();

      //   if (ev.lengthComputable) {
      //     this.uppy.emit("upload-progress", file, {
      //       uploader: this,
      //       bytesUploaded: ev.loaded,
      //       bytesTotal: ev.total
      //     });
      //   }
      // });

      // xhr.addEventListener("load", ev => {
      //   this.uppy.log(`[XHRUpload] finished`);
      //   timer.done();
      //   queuedRequest.done();
      //   if (uploaderEvents[file.id]) {
      //     uploaderEvents[file.id].remove();
      //     uploaderEvents[file.id] = null;
      //   }

      //   if (this.validateStatus(ev.target.status, xhr.responseText, xhr)) {
      //     console.log("actually the 1st response check goes through");
      //     // this.$emit("uploaded", JSON.parse(ev.target.response));
      //     console.log(
      //       "'load' -> JSON.parse(ev.target.response)",
      //       JSON.parse(ev.target.response)
      //     );

      //     const body = this.getResponseData(xhr.responseText, xhr);
      //     const uploadURL = body[opts.responseUrlFieldName];

      //     const uploadResp = {
      //       status: ev.target.status,
      //       body,
      //       uploadURL
      //     };

      //     this.uppy.emit("upload-success", file, uploadResp);

      //     if (uploadURL) {
      //       this.uppy.log(`Download ${file.name} from ${uploadURL}`);
      //       console.log(`Download ${file.name} from ${uploadURL}`);
      //     }

      //     // return resolve(file);
      //   } else {
      //     const body = this.getResponseData(xhr.responseText, xhr);
      //     const error = buildResponseError(
      //       xhr,
      //       this.getResponseError(xhr.responseText, xhr)
      //     );

      //     const response = {
      //       status: ev.target.status,
      //       body
      //     };

      //     this.uppy.emit("upload-error", file, error, response);
      //     console.error(error);
      //     // return reject(error);
      //   }
      // });

      // xhr.addEventListener("error", ev => {
      //   this.uppy.log(`[XHRUpload] errored`);
      //   timer.done();
      //   queuedRequest.done();
      //   if (uploaderEvents[file.id]) {
      //     uploaderEvents[file.id].remove();
      //     uploaderEvents[file.id] = null;
      //   }

      //   const error = buildResponseError(
      //     xhr,
      //     this.getResponseError(xhr.responseText, xhr)
      //   );
      //   this.uppy.emit("upload-error", file, error);
      //   console.error(error);
      //   // return reject(error);
      // });

      // xhr.open(global_opts.method.toUpperCase(), global_opts.endpoint);
      // // IE10 does not allow setting `withCredentials` and `responseType`
      // // before `open()` is called.
      // xhr.withCredentials = global_opts.withCredentials;
      // if (global_opts.responseType !== "") {
      //   xhr.responseType = global_opts.responseType;
      // }

      // // Object.keys(opts.headers).forEach(header => {
      // //   xhr.setRequestHeader(header, opts.headers[header]);
      // // });

      // const queuedRequest = requests.run(() => {
      //   xhr.send(formData);
      //   return () => {
      //     timer.done();
      //     xhr.abort();
      //   };
      // });

      // this.onFileRemove(file.id, () => {
      //   queuedRequest.abort();
      //   console.error("File removed");
      //   // reject(new Error("File removed"));
      // });

      // this.onCancelAll(file.id, () => {
      //   queuedRequest.abort();
      //   console.error("Upload cancelled");
      //   // reject(new Error("Upload cancelled"));
      // });
      // });

      // ----------------------------------------------------

      const formPost = new FormData();
      formPost.append("file", file.data);
      formPost.append("upload_preset", this.preset);
      formPost.append("tags", this.tags);

      console.log("formPost: ", formPost);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("loadstart", () => {
        this.uppy.emit("upload-started", file.id);
      });

      xhr.addEventListener("load", ev => {
        if (ev.target.status === 200) {
          this.$emit("uploaded", JSON.parse(ev.target.response));
          this.uppy.emit("upload-success", file.id);
        } else {
          this.uppy.emit(
            "upload-error",
            file.id,
            new Error("Failed to upload")
          );
        }
      });

      xhr.addEventListener("error", () => {
        this.uppy.emit("upload-error", file.id, new Error("Failed to upload"));
      });

      xhr.upload.addEventListener("progress", ev => {
        // timer.progress();

        if (!ev.lengthComputable) return;

        this.uppy.emit("upload-progress", file, {
          uploader: this,
          id: file.id,
          bytesUploaded: (ev.loaded / ev.total) * file.size,
          bytesTotal: file.size
        });
      });

      if (file.type.startsWith("video")) {
        xhr.open("POST", `${BASE_URL}${this.cloudName}${VIDEO_POSTFIX}`);
      } else {
        xhr.open("POST", `${BASE_URL}${this.cloudName}${IMAGE_POSTFIX}`);
      }

      xhr.send(formPost);
    },
    // Create an instance of Uppy.io
    createUppyInstance() {
      return (
        Uppy({
          autoProceed: this.autoProceed,
          restrictions: {
            maxFileSize: this.maxFileSize,
            maxNumberOfFiles: this.maxNumberOfFiles,
            minNumberOfFiles: this.minNumberOfFiles,
            allowedFileTypes: this.allowedFileTypes
          }
        })
          .use(Dashboard, {
            target: "body",
            showProgressDetails: this.showProgressDetails,
            closeModalOnClickOutside: this.closeModalOnClickOutside
          })
          // .use(XHRUpload, {
          //   endpoint: "https://api.cloudinary.com/v1_1/rootless/upload",
          //   formData: true,
          //   method: "post",
          //   headers: {
          //     "X-CSRF-TOKEN": window.csrfToken
          //   },
          //   // withCredentials: true,
          //   metaFields: { upload_preset: this.preset }
          //   //'https://api2.transloadit.com'
          // })
          .use(ProgressBar, {
            // Options
          })
          .use(StatusBar, {
            // Options
          })
          .use(Informer, {
            // Options
          })
          // .use(Webcam, {
          //   target: Dashboard,
          // })
          // .setMeta({ upload_preset: this.preset })
          .run()
      );
    },
    // Complete handler for Uppy
    completeHandler(result) {
      console.log("completeHandler: ", result);
      result.successful.forEach(file => {
        this.uploadFile(file);
      });
    }
  },
  mounted() {
    this.uppy = this.createUppyInstance();
    // this.uppy.on("file-added", file => {
    //   uppy.setFileMeta(file.id, {
    //     upload_preset: this.preset
    //   });
    // });
    this.uppy.on("file-added", file => {
      console.log("Added file", file);
      // this.uppy.setFileMeta(file.id, {
      //   upload_preset: this.preset
      // });
      // upload_preset: this.preset
    });
    this.uppy.on("complete", this.completeHandler);
  },
  data() {
    return {
      uppy: {}
    };
  }
};
</script>

<style lang="scss" scoped>
.uploader {
  text-decoration: none;
  color: #fff;
  background-color: lightblue;
  text-align: center;
  letter-spacing: 0.5px;
  -webkit-transition: 0.2s ease-out;
  transition: 0.2s ease-out;
  cursor: pointer;
  font-size: 1.2rem;
  outline: 0;
  border: none;
  border-radius: 2px;
  display: inline-block;
  height: 36px;
  line-height: 36px;
  padding: 0 2rem;
  text-transform: uppercase;
  vertical-align: middle;
  -webkit-tap-highlight-color: transparent;

  .fa-cloud-upload-alt {
    margin-top: 5px;
  }
}
</style>
