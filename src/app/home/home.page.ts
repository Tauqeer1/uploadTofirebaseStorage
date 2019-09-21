import { Component } from "@angular/core";
import { LoadingController } from "@ionic/angular";

import { File, FileEntry } from "@ionic-native/file/ngx";
import { FilePath } from "@ionic-native/file-path/ngx";
import { Camera, CameraOptions } from "@ionic-native/camera/ngx";
import { MediaCapture } from "@ionic-native/media-capture/ngx";

import { AngularFireStorage } from "@angular/fire/storage";

import { finalize } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"]
})
export class HomePage {
  loading;
  downloadUrl: Observable<string>;
  constructor(
    private camera: Camera,
    private file: File,
    private filePath: FilePath,
    private mediaCapture: MediaCapture,
    private storage: AngularFireStorage,
    private loadingCtrl: LoadingController
  ) {}

  async captureImage() {
    try {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.CAMERA,
        mediaType: this.camera.MediaType.PICTURE
      };
      const imagePath = await this.camera.getPicture(options);
      this.uploadImageToFirebaseStorage(imagePath);
    } catch (err) {
      console.error("err", err);
    }
  }

  async captureVideo() {
    try {
      const videoData = await this.mediaCapture.captureVideo({
        limit: 1,
        duration: 7
      });
      this.uploadVideoToFirebaseStorage(videoData[0].fullPath);
    } catch (err) {
      console.error("err", err);
    }
  }

  async loadImageFromLibrary() {
    try {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        mediaType: this.camera.MediaType.PICTURE
      };
      const imagePath = await this.camera.getPicture(options);
      this.uploadImageToFirebaseStorage(imagePath);
    } catch (err) {
      console.error("err", err);
    }
  }

  async loadVideoFromLibrary() {
    try {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        mediaType: this.camera.MediaType.VIDEO
      };
      const videoPath = await this.camera.getPicture(options);
      this.uploadVideoToFirebaseStorage(`file://${videoPath}`);
    } catch (err) {
      console.error("err", err);
    }
  }

  async uploadImageToFirebaseStorage(imagePath) {
    try {
      const fileEntry: Partial<
        FileEntry
      > = await this.file.resolveLocalFilesystemUrl(
        await this.filePath.resolveNativePath(imagePath)
      );
      console.log("fileEntry", fileEntry);
      fileEntry.file(
        async fileDetails => {
          console.log("fileDetails", fileDetails);
          const { nativeURL } = fileEntry;
          const { size, type, name } = fileDetails;
          const sizeInMb = size / 1024 / 1024;
          console.log("sizeInMb", sizeInMb);
          console.log("type", type);
          console.log("name", name);
          const dirPath = nativeURL.substring(0, nativeURL.lastIndexOf("/"));
          const buffer = await this.file.readAsArrayBuffer(dirPath, name);
          const imageBlob = new Blob([buffer], { type });
          console.log("imageBlob", imageBlob);
          const uploadPath = `tauqeerStorage/${new Date().getTime()}_${name}`;
          const fileRef = this.storage.ref(uploadPath);
          const uploadFile = this.storage.upload(uploadPath, imageBlob);
          this.presentLoading();
          uploadFile
            .snapshotChanges()
            .pipe(
              finalize(() => {
                this.downloadUrl = fileRef.getDownloadURL();
                this.stopLoading();
              })
            )
            .subscribe();
        },
        error => {
          console.error("error metadata", error);
        }
      );
    } catch (err) {
      this.stopLoading();
      console.error("uploading error", err);
    }
  }

  async uploadVideoToFirebaseStorage(videoPath) {
    try {
      const fileEntry: Partial<
        FileEntry
      > = await this.file.resolveLocalFilesystemUrl(
        await this.filePath.resolveNativePath(videoPath)
      );
      console.log("fileEntry", fileEntry);
      fileEntry.file(
        async fileDetails => {
          console.log("fileDetails", fileDetails);
          const { nativeURL } = fileEntry;
          const { size, type, name } = fileDetails;

          const sizeInMb = size / 1024 / 1024;
          console.log("sizeInMb", sizeInMb);
          console.log("type", type);
          console.log("name", name);
          const dirPath = nativeURL.substring(0, nativeURL.lastIndexOf("/"));
          const buffer = await this.file.readAsArrayBuffer(dirPath, name);
          const videoBlob = new Blob([buffer], { type });
          const uploadPath = `tauqeerStorage/${new Date().getTime()}_${name}`;
          const fileRef = this.storage.ref(uploadPath);
          const uploadFile = this.storage.upload(uploadPath, videoBlob);
          this.presentLoading();
          uploadFile
            .snapshotChanges()
            .pipe(
              finalize(() => {
                this.downloadUrl = fileRef.getDownloadURL();
                this.stopLoading();
              })
            )
            .subscribe();
        },
        error => {
          console.error("error metadata", error);
        }
      );
    } catch (err) {
      this.stopLoading();
      console.error("uploading error", err);
    }
  }

  async presentLoading() {
    this.loading = await this.loadingCtrl.create({
      message: "Please Wait"
    });
    await this.loading.present();
  }

  async stopLoading() {
    this.loading.dismiss();
  }
}
