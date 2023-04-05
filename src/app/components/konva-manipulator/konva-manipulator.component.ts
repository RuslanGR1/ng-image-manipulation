import {
  Component,
  EventEmitter,
  OnInit,
  ViewChild,
  NgZone,
} from '@angular/core';
import { KonvaComponent } from 'ng2-konva';
import { Observable, of } from 'rxjs';

interface Window {
  Image: any;
  document: any;
}

interface ImageConfig {
  id: number;
  emitter: EventEmitter<any>;
  src?: string | undefined;
}

declare const window: Window;

@Component({
  selector: 'app-konva-manipulator',
  templateUrl: './konva-manipulator.component.html',
  styleUrls: ['./konva-manipulator.component.css'],
})
export class KonvaManipulatorComponent implements OnInit {
  private readonly maxImages = 10;

  constructor(private readonly zone: NgZone) {}

  public configImage: EventEmitter<any> = new EventEmitter();
  @ViewChild('stage') stage?: KonvaComponent;
  images: ImageConfig[] = [];

  imageUrls: string[] = [];
  imageConfigs: EventEmitter<any>[] = [];

  public configStage: Observable<any> = of({
    width: 1000,
    height: 600,
  });

  convertBase64 = (file: File) => {
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
  };

  async processFile(imageInput: any) {
    const file: File = imageInput.files[0];
    const baseImg = await this.convertBase64(file);
    this.imageUrls.push(baseImg as string);
    const [image] = this.images.filter((image) => !image.src);

    image.src = baseImg as string;
    const imageT = new window.Image();
    imageT.src = baseImg as string;
    image.emitter.emit({
      image: imageT,
      draggable: true,
    });
  }

  exportImage(): void {
    const [convas] = window.document.getElementsByTagName('canvas');
    const dataUrl = convas.toDataURL();
    const link = document.createElement('a');
    link.download = 'result.jpg';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(convas);
  }

  showImage() {
    this.images.forEach((imageConf) => {
      const imageT = new window.Image();
      imageT.src = imageConf.src;
      imageT.onload = () => {
        imageConf.emitter.emit({
          image: imageT,
          draggable: true,
        });
      };
    });
  }

  ngOnInit() {
    for (let i = 0; i < this.maxImages; i++) {
      this.images.push({
        id: i,
        emitter: new EventEmitter<any>(),
      });
    }
  }
}
