import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageManipulatorService {
  convertBase64(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  exportImage(dataURL: string | undefined, imageName: string): void {
    var link = document.createElement('a');
    link.download = imageName;
    if (!dataURL) {
      return;
    }
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
