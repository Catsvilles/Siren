import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import oscP5.*; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class shader_trial extends PApplet {

PGraphics pg;

public void setup() {
  
  //fullScreen(P3D, 1);
  pg = createGraphics(width,height, P3D);

  /* start oscP5, listening for incoming messages at port 12000
     IP = 127.0.0.1 */
  oscP5 = new OscP5(this, 12000);

  initFilters();
  initShaders();
}

public void draw() {
  background(20);

  updateUniforms_Filters();
  updateUniforms_Shaders();

  // Main object drawn
  drawSpheres();
  drawShaders();

  // post-processing effects
  presets();
  glitchFx();
  strobeFx();
  randomMasksFx();
  toggleFilters();

  // Overall subtle line pattern
  filter(lines);

  // Debugging texts
  fill(255);
  textSize(25);
  text(frameRate, 5, 30);
}
PShader lines;
PShader shake;
PShader rgbShift;
PShader hueSaturation;
PShader brightContrast;
PShader barrelBlur;
PShader glow;
PShader halftone;
PShader pixelate;
PShader pixelRolls;
PShader patches;
PShader edge;
PShader mirror;

ArrayList<PShader> filters = new ArrayList();
ArrayList<String>  filterNames = new ArrayList();

public void updateUniforms_Filters() {
  shake.set("time", (float)millis()/1000.0f);
  barrelBlur.set("time", (float)millis()/1000.0f);
  pixelRolls.set("time", (float)millis()/1000.0f);
}

public void initFilters() {
  f_init_Lines();
  f_init_Shake();
  f_init_RGBShift();
  f_init_HueSaturation();
  f_init_BrightnessContrast();
  f_init_BarrelBlur();
  f_init_Glow();
  f_init_Halftone();
  f_init_Pixelate();
  f_init_PixelRolls();
  f_init_Patches();
  f_init_Edge();
  f_init_Mirror();
}

public void f_init_Lines() {
  lines = loadShader("texture/lines.glsl");

  lines.set("lineStrength", 0.09f);
  lines.set("lineSize", 2000.f);
  lines.set("lineTilt", 0.45f);

  filters.add(lines);
  filterNames.add("lines");
}

public void f_init_Shake() {
  shake = loadShader("texture/shake.glsl");

  shake.set("time", millis());
  shake.set("amount", 0.01f);     // 0-1.0

  shake.set("mask_c", 0.0f, .0f);
  shake.set("mask_d", 1.f, 1.f);

  filters.add(shake);
  filterNames.add("shake");
}

public void f_init_RGBShift() {
  rgbShift = loadShader("texture/rgbShift.glsl");

  rgbShift.set("angle", PI);     // 0-TWO_PI
  rgbShift.set("amount", 0.005f); // 0-0.1

  rgbShift.set("mask_c", 0.0f, .0f);
  rgbShift.set("mask_d", 1.f, 1.f);

  filters.add(rgbShift);
  filterNames.add("rgbShift");
}

public void f_init_HueSaturation() {
  hueSaturation = loadShader("texture/hueSaturation.glsl");

  hueSaturation.set("hue", 0.0f);         // 0 - 2
  hueSaturation.set("saturation", 1.0f);  // -1 - 1

    hueSaturation.set("mask_c", 0.0f, .0f);
    hueSaturation.set("mask_d", 1.f, 1.f);
  filters.add(hueSaturation);
  filterNames.add("hueSaturation");
}

public void f_init_BarrelBlur() {
  barrelBlur = loadShader("texture/barrelBlur.glsl");

  barrelBlur.set("amount", 0.1f);

    barrelBlur.set("mask_c", 0.0f, .0f);
    barrelBlur.set("mask_d", 1.f, 1.f);
  filters.add(barrelBlur);
  filterNames.add("barrelBlur");
}

public void f_init_BrightnessContrast() {
  brightContrast = loadShader("texture/brightContrast.glsl");

  brightContrast.set("brightness", 1.0f);
  brightContrast.set("contrast", 1.0f);

    brightContrast.set("mask_c", 0.0f, .0f);
    brightContrast.set("mask_d", 1.f, 1.f);
  filters.add(brightContrast);
  filterNames.add("brightContrast");
}


public void f_init_Glow() {
  glow = loadShader("texture/glow.glsl");

  glow.set("brightness", 0.25f); // 0-0.5
  glow.set("radius", 2);        // 0-3

    glow.set("mask_c", 0.0f, .0f);
    glow.set("mask_d", 1.f, 1.f);
  filters.add(glow);
  filterNames.add("glow");
}

public void f_init_Halftone() {
  halftone = loadShader("texture/halftone.glsl");

  halftone.set("pixelsPerRow", 80);

    halftone.set("mask_c", 0.0f, .0f);
    halftone.set("mask_d", 1.f, 1.f);
  filters.add(halftone);
  filterNames.add("halftone");
}

public void f_init_Pixelate() {
  pixelate = loadShader("texture/pixelate.glsl");

  pixelate.set("pixels", 0.1f * width, 0.1f * height);

    pixelate.set("mask_c", 0.0f, .0f);
    pixelate.set("mask_d", 1.f, 1.f);
  filters.add(pixelate);
  filterNames.add("pixelate");
}

public void f_init_Patches() {
  patches = loadShader("texture/patches.glsl");

  patches.set("row", 0.5f);
  patches.set("col", 0.5f);

    patches.set("mask_c", 0.0f, .0f);
    patches.set("mask_d", 1.f, 1.f);
  filters.add(patches);
  filterNames.add("patches");
}

public void f_init_PixelRolls() {
  pixelRolls = loadShader("texture/pixelrolls.glsl");

  pixelRolls.set("pixels", 50.0f, 10.0f);
  pixelRolls.set("rollRate", 10.0f);        //0-10
  pixelRolls.set("rollAmount", 0.09f);

    pixelRolls.set("mask_c", 0.0f, .0f);
    pixelRolls.set("mask_d", 1.f, 1.f);

  filters.add(pixelRolls);
  filterNames.add("pixelRolls");
}

public void f_init_Edge(){
  edge = loadShader("texture/edges.glsl");

  edge.set("mask_c", 0.0f, .0f);
  edge.set("mask_d", 1.f, 1.f);

  filters.add(edge);
  filterNames.add("edge");
}

public void f_init_Mirror(){
  mirror = loadShader("texture/mirror.glsl");

  mirror.set("dir", 0.0f);  // 0 vertical, 1 horizontal

  mirror.set("mask_c", 0.0f, .0f);
  mirror.set("mask_d", 1.f, 1.f);

  filters.add(mirror);
  filterNames.add("mirror");
}

OscP5 oscP5;

// global filter toggles
boolean isshake = false;
boolean isrgbShift = false;
boolean ishueSaturation = false;
boolean isbrightContrast = false;
boolean isfxaa = false;
boolean isbarrelBlur = false;
boolean isglow = false;
boolean ishalftone = false;
boolean ispixelate = false;
boolean ispixelRolls = false;
boolean ispatches = false;
boolean isedge = false;
boolean ismirror = false;

/* incoming osc message are forwarded to the oscEvent method. */
public void oscEvent(OscMessage m)
{
  // sendOSC `channel` $ Message "global" [string "global", Float 1]
  if(getName(m).equals("global")){
    if (m.checkTypetag("sf"))
    {
      String arg = m.get(0).stringValue();
      float val = m.get(1).floatValue();

      switch(arg){
        case "glitch":
          glitchLasttime = millis();
          glitchTime = val;   break;
        case "strobe":
          strobeLasttime = millis();
          strobeTime = val;   break;
        case "randMask":
          randomMaskLasttime = millis();
          randomMaskTime = val;   break;
        case "preset":
          presetNumber = PApplet.parseInt(val);   break;
        case "shake":
          isshake = !isshake;
          if(isshake) toggledFilters.add(shake);
          else toggledFilters.remove(shake); break;
        case "rgbShift":
          isrgbShift = !isrgbShift;
          if(isrgbShift) toggledFilters.add(rgbShift);
          else toggledFilters.remove(rgbShift); break;
        case "hueSaturation":
          ishueSaturation = !ishueSaturation;
          if(ishueSaturation) toggledFilters.add(hueSaturation);
          else toggledFilters.remove(hueSaturation); break;
        case "brightContrast":
          isbrightContrast = !isbrightContrast;
          if(isbrightContrast) toggledFilters.add(brightContrast);
          else toggledFilters.remove(brightContrast); break;
        case "barrelBlur":
          isbarrelBlur = !isbarrelBlur;
          if(isbarrelBlur) toggledFilters.add(barrelBlur);
          else toggledFilters.remove(barrelBlur); break;
        case "glow":
          isglow = !isglow;
          if(isglow) toggledFilters.add(glow);
          else toggledFilters.remove(glow); break;
        case "halftone":
          ishalftone = !ishalftone;
          if(ishalftone) toggledFilters.add(halftone);
          else toggledFilters.remove(halftone); break;
        case "pixelate":
          ispixelate = !ispixelate;
          if(ispixelate) toggledFilters.add(pixelate);
          else toggledFilters.remove(pixelate); break;
        case "pixelRolls":
          ispixelRolls = !ispixelRolls;
          if(ispixelRolls) toggledFilters.add(pixelRolls);
          else toggledFilters.remove(pixelRolls); break;
        case "patches":
          ispatches = !ispatches;
          if(ispatches) toggledFilters.add(patches);
          else toggledFilters.remove(patches); break;
        case "edge":
          isedge = !isedge;
          if(isedge) toggledFilters.add(edge);
          else toggledFilters.remove(edge); break;
        case "mirror":
          ismirror = !ismirror;
          if(ismirror) toggledFilters.add(mirror);
          else toggledFilters.remove(mirror); break;
        default:
          break;
      }
    }
  }
  else if(getName(m).equals("object")){
    if (m.checkTypetag("sf"))
    {
      // get attr name and value
      String arg = m.get(0).stringValue();
      float val = m.get(1).floatValue();

      switch(arg){
        case "spheres":
          isSpheres = !isSpheres; break;
        case "shaders":
          shaderNumber = (int)val; break;
        default:
          break;
      }
    }
  }
  else // per filter modification
  {
    // sendOSC `channel` $ Message "FilterName" [string "AttrName", Float AttrValue]
    if (m.checkTypetag("sf"))
    {
      // get attr name and value
      String arg = m.get(0).stringValue();
      float val = m.get(1).floatValue();

      // Get filter index
      int index = -1;
      for (int i = 0; i < filterNames.size(); ++i) {
        if (filterNames.get(i).equals(getName(m))) {
          index = i;
        }
      }

      // Apply modification
      if (index >= 0) {
        filters.get(index).set(arg, val);
      }
    }
  }
}

public String getName(OscMessage m) {
  String s = "";
  for (int i = 0; i < m.getAddrPatternAsBytes().length; i++) {
    if ((char) m.getAddrPatternAsBytes()[i] != 0)
      s += (char) m.getAddrPatternAsBytes()[i];
  }
  return s;
}
PShader blobby;
PShader drip;
PShader bands;
PShader sine;
PShader noise;
PShader bits;

public void initShaders() {
  s_init_Bands();
  s_init_Bits();
  s_init_Blobby();
  s_init_Drip();
  s_init_Noise();
  s_init_Sine();
}

public void updateUniforms_Shaders(){
  blobby.set("time", (float) millis()/1000.0f);
  blobby.set("resolution", PApplet.parseFloat(width), PApplet.parseFloat(height));
  drip.set("time", (float) millis()/1000.0f);
  drip.set("resolution", PApplet.parseFloat(width), PApplet.parseFloat(height));
  bands.set("time", (float) millis()/1000.0f);
  bands.set("resolution", PApplet.parseFloat(width), PApplet.parseFloat(height));
  sine.set("time", (float) millis()/1000.0f);
  sine.set("resolution", PApplet.parseFloat(width), PApplet.parseFloat(height));
  noise.set("time", (float) millis()/1000.0f);
  noise.set("resolution", PApplet.parseFloat(width), PApplet.parseFloat(height));
  bits.set("time", (float) millis()/1000.0f);
  bits.set("resolution", PApplet.parseFloat(width), PApplet.parseFloat(height));
}

public void s_init_Bands(){
  bands = loadShader("color/bands.glsl");

  bands.set("noiseFactor", 20.0f); // 5-100
  bands.set("stripes", 50.0f);     // 0-100
}

public void s_init_Bits(){
  bits = loadShader("color/bits.glsl");

  bits.set("mx", .5f); // 0-1
  bits.set("my", .5f); // 0-1
}

public void s_init_Blobby(){
  blobby = loadShader("color/blobby.glsl");

  blobby.set("depth", 1.0f); //0-2
  blobby.set("rate", 1.0f);  //0-2
}

public void s_init_Drip(){
  drip = loadShader("color/drip.glsl");

  drip.set("intense", .5f); // 0-1
  drip.set("speed", .5f);   // 0-1
  drip.set("graininess", .5f, .5f); // vec2(0-1, 0-1)
}

public void s_init_Noise(){
  noise = loadShader("color/noisy.glsl");

  noise.set("noiseFactor", 5.0f, 5.0f); // vec2(0-10, 0-10)
  noise.set("noiseFactorTime", 1.0f);  // 0-2
}

public void s_init_Sine(){
  sine = loadShader("color/sinewave.glsl");

  sine.set("colorMult", 2.f, 1.25f); // vec2(.5-5, .5-2)
  sine.set("coeffx", 20.f); // 10-50
  sine.set("coeffy", 40.f);  // 0-90
  sine.set("coeffz", 50.f); // 1-200
}
boolean isSpheres = false;
int shaderNumber = 0;

public void drawSingleSphere(float detail, PVector pos, int fill){
  pushMatrix();
  noStroke();
  fill(fill);
  translate(pos.x, pos.y, pos.z);
  scale(3);
  sphere(detail);
  popMatrix();
}

public void drawSpheres(){
  pushMatrix();
  translate(width/2, height/2, 0);
  rotateZ(map(millis(), 0, 5000, 0, TWO_PI)%TWO_PI);
  drawSingleSphere(5, new PVector(-100, -100, 0), color(64,88,190));
  drawSingleSphere(5, new PVector(0, 0, 0), color(200,150,50));
  drawSingleSphere(5, new PVector(100, 100, 0), color(82, 200, 50));
  drawSingleSphere(5, new PVector(-100, 100, 0), color(200));
  drawSingleSphere(5, new PVector(100, -100, 0), color(50));
  popMatrix();
}

public void drawShaders(){
  if(shaderNumber > 0){
    pg.beginDraw();
    if(shaderNumber == 1)
      pg.shader(blobby);
    else if(shaderNumber == 2)
      pg.shader(bits);
    else if(shaderNumber == 3)
      pg.shader(bands);
    else if(shaderNumber == 4)
      pg.shader(noise);
    else if(shaderNumber == 5)
      pg.shader(sine);
    else if(shaderNumber == 6)
      pg.shader(drip);
    pg.rect(0,0,pg.width, pg.height);
    pg.endDraw();

    image(pg, 0, 0);
  }
}
// Timings /////
float glitchLasttime = 0;
float glitchTime = 0;

float strobeLasttime = 0;
float strobeTime = 0;

float randomMaskLasttime = 0;
float randomMaskTime = 0;
/////////////////

int presetNumber = 0;

// Keeps track of toggled shaders
ArrayList<PShader> toggledFilters = new ArrayList<PShader>();

// Glitch Effect
public void glitchFx(){
  if(glitchLasttime+glitchTime > millis()){
    pixelate.set("pixels", random(1, 0.1f * width), random(1, 0.1f * height));

    glow.set("mask_c", 0.f, .0f);
    glow.set("mask_d", 1.f, 1.f);
    pixelate.set("mask_c", 0.f, .0f);
    pixelate.set("mask_d", 1.f, 1.f);

    filter(glow);
    filter(pixelate);
  }
}

// Strobe effect
public void strobeFx(){
  if(strobeLasttime + strobeTime > millis()){
    brightContrast.set("brightness", random(-5, 5));
    brightContrast.set("contrast", random(-5, 5));

    brightContrast.set("mask_c", 0.f, .0f);
    brightContrast.set("mask_d", 1.f, 1.f);

    filter(brightContrast);
  }
  else{
    brightContrast.set("brightness", 1.f);
    brightContrast.set("contrast", 1.f);
    filter(brightContrast);
  }
}

// Masks effects randomly
public void randomMasksFx(){
  if(randomMaskLasttime + randomMaskTime > millis()){
    float orientation = random(-1, 1);
    float rand_x = random(1);
    float rand_width = random(1);
    float rand_y = random(1);
    float rand_height = random(1);
    for(int i = 0; i < filters.size(); i++)
    {
      if(orientation > 0){
        filters.get(i).set("mask_c", 0.f, rand_y);
        filters.get(i).set("mask_d", 1.f, rand_height);
      }
      else{
        filters.get(i).set("mask_c", rand_x, 0.f);
        filters.get(i).set("mask_d", rand_width, 1.f);
      }
    }
  }
  else{
    for(int i = 0; i < filters.size(); i++)
    {
      filters.get(i).set("mask_c", 0.f, 0.f);
      filters.get(i).set("mask_d", 1.f, 1.f);
    }
  }
}

// Toggle Filters
public void toggleFilters() {
  for(int i = 0; i < toggledFilters.size(); i++) {
    filter(toggledFilters.get(i));
  }
}

// Saved filter sequences
public void presets(){
  if(presetNumber == 1){
    filter(shake);
    filter(rgbShift);
    filter(hueSaturation);
    filter(brightContrast);
    filter(barrelBlur);
    filter(glow);
    filter(halftone);
    filter(mirror);
  }
  else if(presetNumber == 2)
  {
    filter(shake);
    filter(rgbShift);
    filter(hueSaturation);
    filter(brightContrast);
    filter(barrelBlur);
    filter(glow);
    filter(pixelRolls);
  }
  else if(presetNumber == 3)
  {
    filter(shake);
    filter(rgbShift);
    filter(hueSaturation);
    filter(brightContrast);
    filter(barrelBlur);
    filter(glow);
    filter(patches);
  }
  else if(presetNumber == 4)
  {
    filter(shake);
    filter(rgbShift);
    filter(hueSaturation);
    filter(brightContrast);
    filter(barrelBlur);
    filter(glow);
    filter(edge);
  }
}
  public void settings() {  size(1000, 800, P3D); }
  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "shader_trial" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}