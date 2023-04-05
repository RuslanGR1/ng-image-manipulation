import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KonvaManipulatorComponent } from './konva-manipulator.component';

describe('KonvaManipulatorComponent', () => {
  let component: KonvaManipulatorComponent;
  let fixture: ComponentFixture<KonvaManipulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KonvaManipulatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KonvaManipulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
