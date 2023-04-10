import { Component, OnInit } from '@angular/core';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';

export enum UserAction {
  ClickTap = 'click tap',
  KeyDown = 'keydown',
  Transform = 'transform',
}

export enum ChangePriorityAction {
  Increase = 'increase',
  Decrease = 'decrease',
}

@Component({
  selector: 'app-native-image-manipulator',
  templateUrl: './native-image-manipulator.component.html',
  styleUrls: ['./native-image-manipulator.component.css'],
})
export class NativeImageManipulatorComponent implements OnInit {
  private _stage: Stage | undefined;
  private _layer: Konva.Layer | undefined;
  private _transformer: Konva.Transformer | undefined;
  private _imageOffset: number = 50;
  private _backgrounLayer: Konva.Rect | undefined;

  lastSelectedObject: Stage | Konva.Shape | undefined;
  priorityAction = ChangePriorityAction;
  imageUrls: string[] = [];
  noteText: string = '';
  opacityText: string = '';

  private readonly resultImageName = 'stage.png';
  private readonly imageObjectName = 'image';
  private readonly textObjectName = 'text';
  private readonly defaultBackgroundColor = '#FFFFFF';
  private readonly defaultNewImagePositionOffset = 50;

  constructor() {}

  private getBackground(): Konva.Rect {
    this._backgrounLayer = new Konva.Rect({
      x: 0,
      y: 0,
      width: this._stage?.width(),
      height: this._stage?.height(),
      fill: this.defaultBackgroundColor,
      draggable: false,
    });
    this._backgrounLayer.zIndex(0);
    return this._backgrounLayer;
  }

  ngOnInit(): void {
    this._stage = new Stage({
      container: 'container',
      width: 1000,
      height: 600,
    });

    this._layer = new Konva.Layer();
    this._stage.add(this._layer);
    this._layer.add(this.getBackground());

    this._transformer = new Konva.Transformer({
      nodes: [],
      keepRatio: false,
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      },
    });
    this._transformer.zIndex(0);
    this._layer?.add(this._transformer);

    this._stage.on(UserAction.ClickTap, (e) => this.stageOnClickTap(e));
  }

  private imageOnLoadWrapper(image: HTMLImageElement): () => void {
    return () => {
      const img_width = image.width;
      const img_height = image.height;

      const max = 300;
      const ratio = img_width > img_height ? img_width / max : img_height / max;

      const loadedImage = new Konva.Image({
        image: image,
        x: this._imageOffset,
        y: 70,
        width: img_width / ratio,
        height: img_height / ratio,
        name: this.imageObjectName,
        draggable: true,
      });

      this._imageOffset += this.defaultNewImagePositionOffset;
      this._layer?.add(loadedImage);

      const transformerIndex = this._transformer?.zIndex();
      transformerIndex && this._transformer?.zIndex(transformerIndex + 1);

      this._transformer?.nodes([loadedImage]);
      this.opacityText = '1';
      this.lastSelectedObject = loadedImage;
    };
  }

  private stageOnClickTap(e: Konva.KonvaEventObject<any>): void {
    if (e.target === this._backgrounLayer) {
      this.clearSelectedNodes();
      this.lastSelectedObject = undefined;
      this.noteText = '';
      this.opacityText = '';
      return;
    }

    if (
      !e.target.hasName(this.imageObjectName) &&
      !e.target.hasName(this.textObjectName)
    ) {
      this.noteText = '';
      return;
    }

    const transformerIndex = this._transformer?.zIndex();
    transformerIndex && this._transformer?.zIndex(transformerIndex + 1);

    this._transformer?.nodes([e.target]);
    this.lastSelectedObject = e.target;

    if (e.target.hasName(this.textObjectName)) {
      this.noteText = e.target.getAttr('text');
      return;
    }

    const currentOpacity = this.lastSelectedObject?.opacity();
    this.opacityText = String(currentOpacity);
  }

  private clearSelectedNodes(): void {
    this._transformer?.nodes([]);
  }

  isNodeSelected(): boolean {
    return !!this.lastSelectedObject;
  }

  isTextNodeSelected(): boolean {
    return this.lastSelectedObject instanceof Konva.Text;
  }

  addText(): void {
    if (this.lastSelectedObject) {
      this.lastSelectedObject.setAttr('text', this.noteText);
      return;
    }

    const text = new Konva.Text({
      x: 50,
      y: 50,
      text: this.noteText,
      draggable: true,
      name: this.textObjectName,
    });
    text.on(UserAction.Transform, () => {
      text.setAttrs({
        width: Math.max(text.width() * text.scaleX(), 20),
        scaleX: 1,
        scaleY: 1,
      });
    });

    this._layer?.add(text);
    this.clearSelectedNodes();
    this._transformer?.nodes([text]);
  }

  exportImage(): void {
    const name = this.resultImageName;
    this.clearSelectedNodes();
    const dataURL = this._stage?.toDataURL({ pixelRatio: 3 });
    var link = document.createElement('a');
    link.download = name;
    if (!dataURL) {
      return;
    }
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteImage(): void {
    this.lastSelectedObject?.destroy();
    this.clearSelectedNodes();
    this.lastSelectedObject = undefined;
  }

  isPriorityButtonActive(action: ChangePriorityAction): boolean {
    if (!this.lastSelectedObject) {
      return false;
    }

    const currentIndex = this.lastSelectedObject.zIndex();
    if (action === ChangePriorityAction.Decrease && currentIndex - 1 === 0) {
      return false;
    }

    return true;
  }

  isOpacityButtonActive(): boolean {
    if (!this.lastSelectedObject) {
      return false;
    }

    return true;
  }

  isDeleteButtonActive(): boolean {
    return !!this.lastSelectedObject;
  }

  setOpacity(): void {
    if (!this.lastSelectedObject) {
      return;
    }
    this.lastSelectedObject.opacity(Number(this.opacityText));
  }

  handlePriorityChange(action: ChangePriorityAction): void {
    if (!this.lastSelectedObject) {
      return;
    }
    const currentIndex = this.lastSelectedObject.zIndex();
    switch (action) {
      case ChangePriorityAction.Increase:
        this.lastSelectedObject.zIndex(currentIndex + 1);
        return;
      case ChangePriorityAction.Decrease:
        this.lastSelectedObject.zIndex(currentIndex - 1);
        return;
    }
  }

  private convertBase64 = (
    file: File
  ): Promise<string | ArrayBuffer | null> => {
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

  async processFile(imageInput: any): Promise<void> {
    this.clearSelectedNodes();
    const file: File = imageInput.files[0];
    const baseImg = await this.convertBase64(file);
    this.imageUrls.push(baseImg as string);
    const URL = window.webkitURL || window.URL;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    img.onload = this.imageOnLoadWrapper(img);
  }
}
