import { Component, OnInit } from '@angular/core';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Box } from 'konva/lib/shapes/Transformer';
import {
  defaultImagePositionPoint,
  defaultTextPositionPoint,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_IMAGE_OPACITY
} from './native-image-manipulator.const';
import { ImageManipulatorService } from './native-image-manipulator.service';
import { ChangePriorityAction, ImageBackgroundOpacityParams, UserAction } from './native-image-manipulator.type';

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

  imageScale: string = '';
  noteText: string = '';
  opacityText: string = '';
  canvasWidth: string = DEFAULT_CANVAS_WIDTH;
  canvasHeight: string = DEFAULT_CANVAS_HEIGHT;

  private readonly resizeEnabledAttr = 'resizeEnabled';

  private readonly resultImageName = 'stage.png';
  private readonly imageObjectName = 'image';
  private readonly textObjectName = 'text';
  private readonly defaultCanvasBackgroundColor = '#FFFFFF';
  private readonly defaultNewImagePositionOffset = 50;

  constructor(private readonly imageManipulatorService: ImageManipulatorService) {}

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

  private setImageBackgroundOpacity(
    imageBackgroundOpacityParams: ImageBackgroundOpacityParams
  ): HTMLCanvasElement | undefined {
    const { image, imgWidth, imgHeight } = imageBackgroundOpacityParams;

    const canvas = document.createElement('canvas');
    canvas.width = imgWidth;
    canvas.height = imgHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0);
    const imgData = context.getImageData(0, 0, imgWidth, imgHeight);
    const data = imgData.data;

    if (data) {
      for (var x = 0; x < data.length; x += 4) {
        const opacityIndex = x + 3;
        if (this.imageManipulatorService.isColorToMakeTransparent(data[x], data[x + 1], data[x + 2])) {
          data[opacityIndex] = 0;
        }
      }
    }

    context.putImageData(imgData, 0, 0);
    return canvas;
  }

  private imageOnLoadWrapper(image: HTMLImageElement): () => void {
    return () => {
      const imgWidth = image.width;
      const imgHeight = image.height;

      const max = 300;
      const ratio = imgWidth > imgHeight ? imgWidth / max : imgHeight / max;

      let convertedImage = this.setImageBackgroundOpacity({ image, imgWidth, imgHeight }) || image;

      const loadedImage = new Konva.Image({
        image: convertedImage,
        x: defaultImagePositionPoint.x,
        y: defaultImagePositionPoint.y,
        width: imgWidth / ratio,
        height: imgHeight / ratio,
        name: this.imageObjectName,
        draggable: true
      });
      loadedImage.setAttr(this.resizeEnabledAttr, false);

      if (!this._layer || !this._transformer) {
        return;
      }

      this._imageOffset += this.defaultNewImagePositionOffset;
      this._layer.add(loadedImage);

      const transformerIndex = this._transformer.zIndex();
      transformerIndex && this._transformer.zIndex(transformerIndex + 1);

      this._transformer.nodes([loadedImage]);
      this.opacityText = String(DEFAULT_IMAGE_OPACITY);
      this.imageScale = String(loadedImage.scale()?.x);
      this.lastSelectedObject = loadedImage;
    };
  }

  private stageOnClickTap(e: Konva.KonvaEventObject<any>): void {
    if (e.target === this._backgrounLayer) {
      this.clearSelectedNodes();
      this.lastSelectedObject = undefined;
      this.noteText = '';
      this.opacityText = '';
      this.imageScale = '';
      return;
    }

    if (!e.target.hasName(this.imageObjectName) && !e.target.hasName(this.textObjectName)) {
      this.noteText = '';
      return;
    }

    if (e.target.hasName(this.imageObjectName)) {
      const resizeEnabled = e.target?.getAttr(this.resizeEnabledAttr);
      const imageScale = e.target?.scale();
      this.imageScale = String(imageScale?.x) || '1';
      this._transformer?.resizeEnabled(resizeEnabled);
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
      fill: this.defaultCanvasBackgroundColor,
      draggable: false
    });
    this._backgrounLayer.zIndex(0);
  }

  private createAndConfigureStage(): void {
    this._stage = new Stage({
      container: 'container',
      width: Number(this.canvasWidth),
      height: Number(this.canvasHeight)
    });
    this._stage.on(UserAction.ClickTap, (e) => this.stageOnClickTap(e));
  }

  private createAndConfigureLayer(): void {
    this._layer = new Konva.Layer();
  }

  private createTransformer(): void {
    const boundBoxFunc = (oldBox: Box, newBox: Box): Box => {
      if (newBox.width < 10 || newBox.height < 10) {
        return oldBox;
      }
      return newBox;
    };

    this._transformer = new Konva.Transformer({
      nodes: [],
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      keepRatio: true,
      resizeEnabled: false,
      boundBoxFunc
    });
  }

  isResizeEnabled(): boolean {
    return this.lastSelectedObject?.getAttr(this.resizeEnabledAttr);
  }

  isNodeSelected(): boolean {
    return !!this.lastSelectedObject;
  }

  isTextNodeSelected(): boolean {
    return this.lastSelectedObject instanceof Konva.Text;
  }

  isCanvasResizeButtonActive(): boolean {
    return !!(this.canvasWidth || this.canvasHeight);
  }

  isImageNodeSelected(): boolean {
    return this.lastSelectedObject instanceof Konva.Image;
  }

  changeSelectedImageScale(): void {
    const scale = { x: +this.imageScale, y: +this.imageScale };
    this.lastSelectedObject?.scale(scale);
  }

  resizeCanvas(): void {
    const width = Number(this.canvasWidth);
    const height = Number(this.canvasHeight);
    if (width) {
      this._stage?.width(width);
      this._backgrounLayer?.width(width);
    }
    if (height) {
      this._stage?.height(height);
      this._backgrounLayer?.height(height);
    }
  }

  toggleScale(): void {
    if (!this.lastSelectedObject) {
      return;
    }
    const scaleEnabld = this.lastSelectedObject.getAttr(this.resizeEnabledAttr);
    this.lastSelectedObject.setAttr(this.resizeEnabledAttr, !scaleEnabld);
    this._transformer?.resizeEnabled(!scaleEnabld);
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
      x: defaultTextPositionPoint.x,
      y: defaultTextPositionPoint.y,
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
