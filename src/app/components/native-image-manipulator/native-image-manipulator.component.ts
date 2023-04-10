import { Component, OnInit } from '@angular/core';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { ImageManipulatorService } from './native-image-manipulator.service';

export enum UserAction {
  ClickTap = 'click tap',
  KeyDown = 'keydown',
  Transform = 'transform'
}

export enum ChangePriorityAction {
  Increase = 'increase',
  Decrease = 'decrease'
}

@Component({
  selector: 'app-native-image-manipulator',
  templateUrl: './native-image-manipulator.component.html',
  styleUrls: ['./native-image-manipulator.component.css']
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

  constructor(private readonly imageManipulatorService: ImageManipulatorService) {}

  private createAndConfigureLayer(): void {
    this._layer = new Konva.Layer();
  }

  ngOnInit(): void {
    this.createAndConfigureStage();
    this.createTransformer();
    this.createAndConfigureLayer();
    this.createBackgroundLayer();

    if (!this._stage || !this._layer || !this._backgrounLayer || !this._transformer) {
      return;
    }
    this._stage.add(this._layer);
    this._layer.add(this._backgrounLayer);
    this._layer.add(this._transformer);
  }

  private imageOnLoadWrapper(image: HTMLImageElement): () => void {
    return () => {
      const imgWidth = image.width;
      const imgHeight = image.height;

      const max = 300;
      const ratio = imgWidth > imgHeight ? imgWidth / max : imgHeight / max;

      const loadedImage = new Konva.Image({
        image,
        x: this._imageOffset,
        y: 70,
        width: imgWidth / ratio,
        height: imgHeight / ratio,
        name: this.imageObjectName,
        draggable: true
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

    if (!e.target.hasName(this.imageObjectName) && !e.target.hasName(this.textObjectName)) {
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

  private createBackgroundLayer(): void {
    this._backgrounLayer = new Konva.Rect({
      x: 0,
      y: 0,
      width: this._stage?.width(),
      height: this._stage?.height(),
      fill: this.defaultBackgroundColor,
      draggable: false
    });
    this._backgrounLayer.zIndex(0);
  }

  private createAndConfigureStage(): void {
    this._stage = new Stage({
      container: 'container',
      width: 1000,
      height: 600
    });
    this._stage.on(UserAction.ClickTap, (e) => this.stageOnClickTap(e));
  }

  private createTransformer(): void {
    this._transformer = new Konva.Transformer({
      nodes: [],
      keepRatio: false,
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }
    });
  }

  isNodeSelected(): boolean {
    return !!this.lastSelectedObject;
  }

  isTextNodeSelected(): boolean {
    return this.lastSelectedObject instanceof Konva.Text;
  }

  addOrChangeText(): void {
    if (!this.noteText.trim()) {
      this.noteText = '';
      return;
    }

    if (this.lastSelectedObject) {
      this.lastSelectedObject.setAttr('text', this.noteText);
      return;
    }

    const text = new Konva.Text({
      x: 50,
      y: 50,
      text: this.noteText,
      draggable: true,
      name: this.textObjectName
    });
    text.on(UserAction.Transform, () => {
      text.setAttrs({
        width: Math.max(text.width() * text.scaleX(), 20),
        scaleX: 1,
        scaleY: 1
      });
    });

    this._layer?.add(text);
    this.clearSelectedNodes();
    this._transformer?.nodes([text]);
  }

  exportImage(): void {
    this.clearSelectedNodes();
    const dataURL = this._stage?.toDataURL({ pixelRatio: 3 });
    this.imageManipulatorService.exportImage(dataURL, this.resultImageName);
  }

  deleteSelectedObject(): void {
    this.noteText = '';
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

  async processFile(imageInput: any): Promise<void> {
    this.clearSelectedNodes();
    const file: File = imageInput.files[0];
    const baseImg = await this.imageManipulatorService.convertBase64(file);
    this.imageUrls.push(baseImg as string);
    const URL = window.webkitURL || window.URL;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    img.onload = this.imageOnLoadWrapper(img);
  }
}
