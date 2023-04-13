import { Injectable } from '@angular/core';
import { COLOR_TO_MAKE_TRANSPARENT } from './native-image-manipulator.const';

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

  isColorToMakeTransparent(r: number, g: number, b: number): boolean {
    return r == COLOR_TO_MAKE_TRANSPARENT.R && g == COLOR_TO_MAKE_TRANSPARENT.G && b == COLOR_TO_MAKE_TRANSPARENT.B;
  }
}
