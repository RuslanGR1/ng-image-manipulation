import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { KonvaManipulatorComponent } from './components/konva-manipulator/konva-manipulator.component';

// Import KonvaModule
import { KonvaModule } from 'ng2-konva';

@NgModule({
  declarations: [AppComponent, KonvaManipulatorComponent],
  imports: [BrowserModule, AppRoutingModule, KonvaModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
