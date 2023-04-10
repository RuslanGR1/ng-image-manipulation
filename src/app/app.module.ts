import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NativeImageManipulatorComponent } from './components/native-image-manipulator/native-image-manipulator.component';

@NgModule({
  declarations: [AppComponent, NativeImageManipulatorComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
