import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NativeImageManipulatorComponent } from './native-image-manipulator.component';

describe('NativeImageManipulatorComponent', () => {
  let component: NativeImageManipulatorComponent;
  let fixture: ComponentFixture<NativeImageManipulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NativeImageManipulatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NativeImageManipulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
