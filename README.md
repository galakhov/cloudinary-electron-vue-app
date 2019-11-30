# cloudinary-vue-electron-app

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run electron:serve
```

### Compiles and minifies for production

```
npm run electron:build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

[Cloudinary Vue SDK Plugin for Vue CLI](https://github.com/cloudinary/vue-cli-plugin-cloudinary).

[Tutorial and examples on integration into a vue app](https://cloudinary.com/documentation/vue_integration).

### Related issues

It is mentioned in the documentation that one can [limit the metadata fields that will be sent to the endpoint as form fields by passing over an array of required field names](https://uppy.io/docs/xhr-upload/#metaFields-null), however, I haven't found any use-cases, reasons, notes or any hints on when to do it.

The issue I have faced with the Cloudinary endpoint ("**X-Cld-Error: Type image/jpeg is not a valid type directive**") is one of such use-cases and yet there could be more of them.

It would be more appropriate not to include "type: image/jpeg" (or whatever type of a file it is) as the default meta field or at least to **list all the default meta fields somewhere in the documentation**.

```JavaScript
Uppy({...})
    .use(XHRUpload, {
        endpoint: "https://api.cloudinary.com/v1_1/[your-cloud-name]/upload",
        formData: true,
        metaFields: ["file", "name", "upload_preset"]
    })

// (...)

this.uppy.on("file-added", file => {
    this.uppy.setFileMeta(file.id, {
        file: file.data,
        upload_preset: this.cloudinaryPreset
    });
});
```

Issue was reported to @uppy/XHR-Upload as "[The cloudinary endpoint always responds with POST 400 error by trying to upload with the default image/jpeg type (or any other image type: image/\*)](https://github.com/transloadit/uppy/issues/1964)".

The complete error message is as follows: "**X-Cld-Error: Type image/jpeg is not a valid type directive**".

![400 bad request](https://user-images.githubusercontent.com/1431049/69892213-7c550e00-1303-11ea-8963-7412ecc89fed.jpg)
