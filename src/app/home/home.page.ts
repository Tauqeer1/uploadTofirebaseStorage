import { Component } from "@angular/core";
import { LoadingController } from "@ionic/angular";

import { File } from "@ionic-native/file/ngx";
import { FilePath } from "@ionic-native/file-path/ngx";
import { Camera, CameraOptions } from "@ionic-native/camera/ngx";
import { MediaCapture } from "@ionic-native/media-capture/ngx";

import { AngularFireStorage } from "@angular/fire/storage";

import { finalize, tap } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"]
})
export class HomePage {
  downloadUrl: Observable<string>;
  progressPercentage: Observable<any>;
  loading;
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
      this.uploadImage(imagePath);
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
      this.uploadVideo(videoData[0].fullPath);
    } catch (err) {
      console.error("err", err);
    }
  }

  async loadImage() {
    try {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        mediaType: this.camera.MediaType.PICTURE
      };
      const imagePath = await this.camera.getPicture(options);
      this.uploadImage(imagePath);
    } catch (err) {
      console.error("err", err);
    }
  }

  async loadVideo() {
    try {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        mediaType: this.camera.MediaType.VIDEO
      };
      const videoPath = await this.camera.getPicture(options);
      this.uploadVideo(`file://${videoPath}`);
    } catch (err) {
      console.error("err", err);
    }
  }

  async uploadImage(imagePath) {
    try {
      const file = await this.file.resolveLocalFilesystemUrl(
        await this.filePath.resolveNativePath(imagePath)
      );
      file.getMetadata(
        async data => {
          const sizeInMb = data.size / 1024 / 1024;
          const dirPathSegments = file.nativeURL.split("/");
          const name = dirPathSegments.pop();
          const dirPath = dirPathSegments.join("/");
          const buffer = await this.file.readAsArrayBuffer(dirPath, name);
          const uploadPath = `tauqeerStorage/${new Date().getTime()}_${name}`;
          const fileRef = this.storage.ref(uploadPath);
          const uploadFile = this.storage.upload(uploadPath, buffer);
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

  async uploadVideo(videoPath) {
    try {
      const file = await this.file.resolveLocalFilesystemUrl(
        await this.filePath.resolveNativePath(videoPath)
      );
      file.getMetadata(
        async data => {
          const sizeInMb = data.size / 1024 / 1024;
          const dirPathSegments = file.nativeURL.split("/");
          const name = dirPathSegments.pop();
          const dirPath = dirPathSegments.join("/");
          const buffer = await this.file.readAsArrayBuffer(dirPath, name);
          const uploadPath = `tauqeerStorage/${new Date().getTime()}_${name}`;
          const fileRef = this.storage.ref(uploadPath);
          const uploadFile = this.storage.upload(uploadPath, buffer);
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
