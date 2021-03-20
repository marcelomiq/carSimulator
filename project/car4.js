// car3.js
// implementazione dei metodi

// STATO DELLA MACCHINA
// (DoStep fa evolvere queste variabili nel tempo)
var px, py, pz, facing; // posizione e orientamento
var mozzoA, mozzoP, sterzo; // stato interno
var vx, vy, vz; // velocita' attuale

// queste di solito rimangono costanti
var velSterzo, velRitornoSterzo, accMax, attrito,
  raggioRuotaA, raggioRuotaP, grip,
  attritoX, attritoY, attritoZ; // attriti
var key;



// da invocare quando e' stato premuto/rilasciato il tasto numero "keycode"
function EatKey(keycode, keymap, pressed_or_released) {
  for (var i = 0; i < 4; i++) {
    if (keycode == keymap[i]) key[i] = pressed_or_released;
  }
}

function CarInit() {
  // inizializzo lo stato della macchina
  px = py = pz = facing = 0; // posizione e orientamento
  //px = -35.3; pz = 15.4;
  px = -38; pz = 23.4;
  mozzoA = mozzoP = sterzo = 0;   // stato
  vx = vy = vz = 0;      // velocita' attuale
  // inizializzo la struttura di controllo
  key = [false, false, false, false];

  velSterzo = 3.4;         // A
    velSterzo=1.26;       // A
  velRitornoSterzo = 0.93; // B, sterzo massimo = A*B / (1-B)

  accMax = 0.0011;
  accMax = 0.0035;

  // attriti: percentuale di velocita' che viene mantenuta
  // 1 = no attrito
  // <<1 = attrito grande
  attritoZ = 0.991;  // piccolo attrito sulla Z (nel senso di rotolamento delle ruote)
  attritoX = 0.8;  // grande attrito sulla X (per non fare slittare la macchina)
  attritoY = 1.0;  // attrito sulla y nullo

  // Nota: vel max = accMax*attritoZ / (1-attritoZ)

  raggioRuotaA = 0.25;
  raggioRuotaP = 0.25;

  grip = 0.45; // quanto il facing macchina si adegua velocemente allo sterzo

  var lastValue=0;
}


function loadMeshData(string, vertices, normals, colorsA, colorsD, colorsS, rgbA, rgbD, rgbS, center) {
  var lines = string.split("\n");
  var positions = [];
  var xmin, xmax, ymin, ymax, zmin, zmax;
  var first = 1;

  for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].trimRight().split(' ');
      if (parts.length > 0) {
          switch (parts[0]) {
              case '#':
                  continue;
              case 'v': 
                  var x = parseFloat(parts[1]);
                  var y = parseFloat(parts[2]);
                  var z = parseFloat(parts[3]);
                  positions.push([x,y,z]);
                  
                  if (first == 1) {
                    xmin = x;
                    xmax = x;
                    ymin = y;
                    ymax = y;
                    zmin = z;
                    zmax = z;
                    first = 0;
                  }
                  else {
                      if(x>xmax) xmax = x;
                      else if (x<xmin) xmin = x;
                      if(y>ymax) ymax = y;
                      else if (y<ymin) ymin = y;
                      if(z>zmax) zmax = z;
                      else if (z<zmin) zmin = z;
                  }
                  break;
              case 'vn':
                  normals.push(
                      vec3.fromValues(
                          parseFloat(parts[1]),
                          parseFloat(parts[2]),
                          parseFloat(parts[3])
                      ));
                  break;
              case 'f': {
                  //"f 1 0 3"  parts[1]=1, parts[2]=0, parts[3]=3
                  if (parts[1].includes("/")){
                    for(var iii = 1; iii<parts.length; iii++){
                      var division = parts[iii].split("/");
                      parts[iii] = division[0];
                    }
                  }

                  if(parts.length==4){
                       /* for (var jj = 1; jj <= 3; jj++) {
                        vertices2.push(positions[parseInt(parts[jj])][0]);
                        vertices2.push(positions[parseInt(parts[jj])][1]);
                        vertices2.push(positions[parseInt(parts[jj])][2]); 
                      }  */
                      addTriangle([parts[1], parts[2], parts[3]], positions, vertices, normals, colorsA, colorsD, colorsS, rgbA, rgbD, rgbS);
                    }
                    else if(parts.length==5){
                      addTriangle([parts[1], parts[2], parts[3]], positions, vertices, normals, colorsA, colorsD, colorsS, rgbA, rgbD, rgbS);
                      addTriangle([parts[1], parts[3], parts[4]], positions, vertices, normals, colorsA, colorsD, colorsS, rgbA, rgbD, rgbS);
                    }
                    break;
              }
              case 'g':{
                if(parts[2]=='leaves'){
                  rgbD = [0.1333, 0.549, 0.1333, 1.0];
                  rgbA = [0.1333, 0.549, 0.1333, 1.0];
                  console.log("BREAKPOINT");
                }
                break;
              }
          }
      }
  }
  var vertexCount = positions.length, total = vertices.length;
  console.log("with " + vertexCount + " vertices " + "TOTAL = " + total);
  center.x = (xmin+xmax)/2;
  center.y = (ymin+ymax)/2;
  center.z = (zmin+zmax)/2;
  //console.log(center.x, center.y, center.z)
  //console.log(colorsS); 
}

function addTriangle(indexes, positions, vertices, normals, colorsA, colorsD, colorsS, rgbA, rgbD, rgbS){
  var a = positions[indexes[0]-1], b = positions[indexes[1]-1], c = positions[indexes[2]-1];
  //console.log(indexes);
  //console.log(vertices);
  if(typeof b == 'undefined' || typeof a == 'undefined' || typeof c == 'undefined') {
      console.log("ERROR addTriangle:")
      console.log(a, b, c)
      console.log(indexes)
      return;
  }
  m = m4.subtractVectors(b, a);
  n = m4.subtractVectors(c, a);
  var normal = m4.cross(m,n);
  normal = m4.normalize(normal);
  
  vertices.push([a[0], a[1], a[2],]);
  normals.push(normal[0], normal[1], normal[2]);
  colorsA.push(rgbA);
  colorsD.push(rgbD);
  colorsS.push(rgbS);

  vertices.push([b[0], b[1], b[2],]);
  normals.push(normal[0], normal[1], normal[2]);
  colorsA.push(rgbA);
  colorsD.push(rgbD);
  colorsS.push(rgbS);

  vertices.push([c[0], c[1], c[2],]);
  normals.push(normal[0], normal[1], normal[2]);
  colorsA.push(rgbA);
  colorsD.push(rgbD);
  colorsS.push(rgbS);
}



// DoStep: facciamo un passo di fisica (a delta-t costante)
//
// Indipendente dal rendering.
//
// ricordiamoci che possiamo LEGGERE ma mai SCRIVERE
// la struttura controller da DoStep
function CarDoStep() {
  // computiamo l'evolversi della macchina

 var vxm, vym, vzm; // velocita' in spazio macchina

  // da vel frame mondo a vel frame macchina
  var cosf = Math.cos(facing * Math.PI / 180.0);
  var sinf = Math.sin(facing * Math.PI / 180.0);
  vxm = +cosf * vx - sinf * vz;
  vym = vy;
  vzm = +sinf * vx + cosf * vz;

  // gestione dello sterzo
  if (key[1]) sterzo += velSterzo;
  if (key[3]) sterzo -= velSterzo;
  sterzo *= velRitornoSterzo; // ritorno a volante fermo

  if (key[0]) vzm -= accMax; // accelerazione in avanti
  if (key[2]) vzm += accMax; // accelerazione indietro

  if(key[4]) {
    vzm += 20*accMax;
    key[4] = false;
  }
  // attriti (semplificando)
  vxm *= attritoX;
  vym *= attritoY;
  vzm *= attritoZ;

  // l'orientamento della macchina segue quello dello sterzo
  // (a seconda della velocita' sulla z)
  facing = facing - (vzm * grip) * sterzo;

  // rotazione mozzo ruote (a seconda della velocita' sulla z)
  var da; //delta angolo
  da = (180.0 * vzm) / (Math.PI * raggioRuotaA);
  mozzoA += da;
  da = (180.0 * vzm) / (Math.PI * raggioRuotaP);
  mozzoP += da;

  // ritorno a vel coord mondo
  vx = +cosf * vxm + sinf * vzm;
  vy = vym;
  vz = -sinf * vxm + cosf * vzm;

  // posizione = posizione + velocita * delta t (ma e' delta t costante)
  px += vx;
  py += vy;
  pz += vz;

  if ((px>-49) && (px<-35) && (pz>-6.5) && (pz<-6.0)){
    console.log("META1")
    if(!meta1) meta1 = true;
  }

  if ((px>30) && (px<50) && (pz>-6.5) && (pz<-6.0)){
    console.log("META2")
    meta2 = true;
  }

  //console.log(px,py,pz)
  /* if (checkForCollision(px, py, pz)>0 && key[2]==false) {
    if (checkForCollision(px, py, pz) <= lastValue){
      //gasON = false;
      px -= vx;
      py -= vy;
      pz -= vz;
      // vx = 0;
      // vy = 0;
      // vz = 0;
      // accMax = 0;
    }
    lastValue = checkForCollision(px, py, pz);
  } */

}

function checkForCollision(px, py, pz){
  var r= 1;
  for(var ii= 0; ii<treePositions.length; ii++){
    if((px>treePositions[ii].x-r) && (px<treePositions[ii].x+r) &&
    (pz>treePositions[ii].z-r) && (pz<treePositions[ii].z+r)) return Math.abs(px-treePositions[ii].x)
        + Math.abs(pz-treePositions[ii].z);
  }
  return -1;
}

//function drawCube(); // questa e' definita altrove (quick hack)
//void drawAxis(); // anche questa

var treePositions = setTreePositions();

function drawMap() {

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer9A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer9D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer9S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer9);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer9);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_position);

  gl.bindBuffer(gl.ARRAY_BUFFER, tex_buffer);
  gl.vertexAttribPointer(_texcoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_texcoord);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(tex_uniform_location, 0);

  gl.uniform1i(_isTexture, 1);

  gl.drawArrays(gl.TRIANGLES, 0, vertices9.length/3);

  gl.uniform1i(_isTexture, 0);
  gl.disableVertexAttribArray(_texcoord);

  drawWalls();
  
  var mo_matrix3 = m4.translate(mo_matrix, -35, 0, -6);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix3);
  drawStick();
  mo_matrix3 = m4.translate(mo_matrix, -48, 0, -6);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix3);
  drawStick();

  mo_matrix3 = m4.translate(mo_matrix, -48, 2, -7);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix3);
  drawFlag();

  for (var ii = 0; ii<treePositions.length; ii++){
    mo_matrix3 = m4.translate(mo_matrix, treePositions[ii].x, -1.5, treePositions[ii].z);
    mo_matrix3 = m4.scale(mo_matrix3, 0.03, 0.03, 0.03);
    mo_matrix3 = m4.scale(mo_matrix3, 0.6, 0.6, 0.6);
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix3);
    drawTree();
  }
  
  
  
}

function drawWalls(){
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer13A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer13D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer13S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer13);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer13);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_position);

  gl.bindBuffer(gl.ARRAY_BUFFER, tex_buffer2);
  gl.vertexAttribPointer(_texcoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_texcoord);

  gl.bindTexture(gl.TEXTURE_2D, texture3);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(tex_uniform_location, 0);

  gl.uniform1i(_isTexture, 1);

  gl.drawArrays(gl.TRIANGLES, 0, vertices13.length/3);

  gl.uniform1i(_isTexture, 0);
  gl.disableVertexAttribArray(_texcoord);
}

function drawStick(){
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer10A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer10D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer10S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer10);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer10);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices10.length/3);
}

function drawFlag(){
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer11A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer11D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer11S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer11);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer11);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_position);

  gl.bindBuffer(gl.ARRAY_BUFFER, tex_buffer2);
  gl.vertexAttribPointer(_texcoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_texcoord);

  gl.bindTexture(gl.TEXTURE_2D, texture2);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(tex_uniform_location, 0);

  gl.uniform1i(_isTexture, 1);

  gl.drawArrays(gl.TRIANGLES, 0, vertices11.length/3);

  gl.uniform1i(_isTexture, 0);
  gl.disableVertexAttribArray(_texcoord);
}

function drawTree(){
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer12A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer12D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer12S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer12);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer12);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices12.length/3);
}

// // disegna una ruota come due cubi intersecati a 45 gradi
function drawWheelFront() {
  var scale = 0.25;
  mo_matrix1 = m4.scale(mo_matrix1, scale, scale, scale);
  mo_matrix1 = m4.translate(mo_matrix1, -center2.x, -center2.y, -center2.z);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix1);
  worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix1));
  gl.uniformMatrix4fv(_worldInverseTranspose, false, worldInverseTransposeMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer5A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer5D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer5S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer5);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer5);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices5.length/3);
}

function drawWheelMetalFront() {
  var scale = 0.25;
  mo_matrix1 = m4.scale(mo_matrix1, scale, scale, scale);
  mo_matrix1 = m4.translate(mo_matrix1, -center4.x, -center4.y, -center4.z);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix1);
  worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix1));
  gl.uniformMatrix4fv(_worldInverseTranspose, false, worldInverseTransposeMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer6A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer6D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer6S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer6);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer6);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices6.length/3);
}

function drawWheelBack() {
  var scale = 0.25;
  mo_matrix1 = m4.scale(mo_matrix1, scale, scale, scale);
  mo_matrix1 = m4.translate(mo_matrix1, -center3.x, -center3.y, -center3.z);

  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix1);
  worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix1));
  gl.uniformMatrix4fv(_worldInverseTranspose, false, worldInverseTransposeMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer7A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer7D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer7S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer7);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer7);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices7.length/3);  
}

function drawWheelMetalBack() {
  var scale = 0.25;
  mo_matrix1 = m4.scale(mo_matrix1, scale, scale, scale);
  mo_matrix1 = m4.translate(mo_matrix1, -center5.x, -center5.y, -center5.z);
  //mo_matrix1 = m4.yRotate(mo_matrix1, Math.PI);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix1);
  worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix1));
  gl.uniformMatrix4fv(_worldInverseTranspose, false, worldInverseTransposeMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer8A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer8D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer8S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer8);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer8);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices8.length/3);  
}





// disegna carlinga composta da 1 cubo traslato e scalato
function drawCarlinga(model_matrix) {

  mo_matrix1 = m4.copy(model_matrix);
  var scale = 0.05;
  mo_matrix1 = m4.scale(mo_matrix1, scale, scale, scale);
  mo_matrix1 = m4.yRotate(mo_matrix1, Math.PI);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix1);
  worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix1));
  gl.uniformMatrix4fv(_worldInverseTranspose, false, worldInverseTransposeMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer4A);
  gl.vertexAttribPointer(_ka, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ka);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer4D);
  gl.vertexAttribPointer(_kd, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_kd);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer4S);
  gl.vertexAttribPointer(_ks, 4, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_ks);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer4);
  gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false,0,0) ; 
  gl.enableVertexAttribArray(_normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer4);
  gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0); 
  gl.enableVertexAttribArray(_position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices4.length/3);

}

// disegna Car
function CarRender() {
  // sono nello spazio mondo

  mo_matrix = m4.translate(mo_matrix, px, py, pz);
  //console.log(mo_matrix);
  mo_matrix = m4.yRotate(mo_matrix, degToRad(facing));

  // sono nello spazio MACCHINA
  drawCarlinga(mo_matrix);
  


  // ruota posteriore D
  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, 0.50, +raggioRuotaP - 0.08, +1);
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoP));
  mo_matrix1 = m4.scale(mo_matrix1, 0.22, raggioRuotaP, raggioRuotaP);
  drawWheelBack();

  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, 0.58, +raggioRuotaP - 0.08, +1);
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoP));
  mo_matrix1 = m4.scale(mo_matrix1, 0.3, raggioRuotaP, raggioRuotaP);
  drawWheelMetalBack();


   // ruota posteriore S
  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, -0.46, +raggioRuotaP - 0.08, +1);
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoP));
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(180));
  mo_matrix1 = m4.scale(mo_matrix1, 0.22, raggioRuotaP, raggioRuotaP);
  drawWheelBack();

  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, -0.54, +raggioRuotaP - 0.08, +1);
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoP));
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(180));
  mo_matrix1 = m4.scale(mo_matrix1, 0.3, raggioRuotaP, raggioRuotaP);
  drawWheelMetalBack();
  

  // ruota anteriore D
  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, 0.62, +raggioRuotaA - 0.04, -0.74);
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(sterzo));
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoA));
  mo_matrix1 = m4.scale(mo_matrix1, 0.3, raggioRuotaA, raggioRuotaA);
  drawWheelMetalFront();

  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, 0.54, +raggioRuotaA - 0.08, -0.75);
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(sterzo));
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoA));
  mo_matrix1 = m4.scale(mo_matrix1, 0.3, raggioRuotaA, raggioRuotaA);
  drawWheelFront();

  

  // ruota anteriore S
  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, -0.57, +raggioRuotaA - 0.04, -0.74);
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(sterzo));
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoA));
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(180));
  mo_matrix1 = m4.scale(mo_matrix1, 0.3, raggioRuotaA, raggioRuotaA);
  drawWheelMetalFront();

  mo_matrix1 = m4.copy(mo_matrix);
  mo_matrix1 = m4.translate(mo_matrix1, -0.49, +raggioRuotaA - 0.08, -0.75);
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(sterzo));
  mo_matrix1 = m4.xRotate(mo_matrix1, degToRad(mozzoA));
  mo_matrix1 = m4.yRotate(mo_matrix1, degToRad(180));
  mo_matrix1 = m4.scale(mo_matrix1, 0.3, raggioRuotaA, raggioRuotaA);
  drawWheelFront(); 
}

function setTreePositions(){
  return [
    {x: -50.0, z: 30},
    {x: -50.0, z: 25.0},
    {x: -50.0, z: 22.0},
    {x: -50.0, z: 19.0},
    {x: -50.0, z: 14.0},
    {x: -50.0, z: 9.0},
    {x: -50.0, z: 4.0},
    {x: -50.0, z: 0.5},
    {x: -50.0, z: -4.0},
    {x: -50.0, z: -9.0},
    {x: -50.0, z: -15.0},
    {x: -32.0, z: 23},
    {x: -32.0, z: 17.5},
    {x: -32.0, z: 12.0},
    {x: -32.0, z: 7.5},
    {x: -32.0, z: 2.0},
    {x: -32.0, z: -3.5},
    {x: -32.0, z: -8.5},
    {x: -32.0, z: -12.0},
    {x: -32.0, z: -18},
    {x: -32.0, z: -23.5},
    {x: -32.0, z: -29.0},
  
    {x: -24.0, z: -31.0},
    {x: -15.0, z: -29.0},
    {x: -27.0, z: -48.0},
    {x: -18.0, z: -47.0},
    {x: -4.0, z: -49.0},
    {x: 5.0, z: -48.0},
    {x: 2.0, z: -34.0},
    {x: -2.0, z: -41.0},
    {x: 8.0, z: -15.0},
    {x: -2.0, z: -11.0},
    {x: -6.0, z: 6.0},
    {x: -12.0, z: 18.0},
    {x: 5.0, z: 17.0},
    {x: 10.0, z: 1.6},
  
    {x: 25.0, z: -26.2},
    {x: 28.0, z: -29.0},
    {x: 5.0, z: -39.0},
    {x: 3.0, z: -42.2},
    {x: -7.0, z: 16.0},
    {x: -8.0, z: 11.0},
    {x: -3.0, z: 14.0},
    {x: -15.0, z: -25.0},
    {x: 3.0, z: -23.0},
    {x: 0.0, z: -17.0},
    {x: -19.0, z: -32.0},
  
    {x: 28.2, z: 33.6},
    {x: 23.2, z: 33.6},
    {x: 20.0, z: 33.6},
    {x: 15.2, z: 33.6},
    {x: 10.2, z: 33.6},
    {x: 6.2, z: 33.6},
    {x: 2.2, z: 33.6},
    {x: -3.2, z: 33.6},
    {x: -8.2, z: 33.6},
    {x: -13.2, z: 33.6},
    {x: -15.2, z: 33.6},
    {x: -20.2, z: 33.6},
    {x: -25.2, z: 33.6},
    {x: -29.2, z: 33.6},
    {x: -32.2, z: 30.6},
  
    {x: 48, z: 45.4},
    {x: 43, z: 48.4},
    {x: 38, z: 48.4},
    {x: 36, z: 48.4},
    {x: 31, z: 48.4},
    {x: 26, z: 48.4},
    {x: 21, z: 48.4},
    {x: 16, z: 48.4},
    {x: 12, z: 48.4},
    {x: 7, z: 48.4},
    {x: 2, z: 48.4},
    {x: -3, z: 48.4},
    {x: -8, z: 48.4},
    {x: -12, z: 48.4},
    {x: -17, z: 48.4},
    {x: -23, z: 48.4},
    {x: -28, z: 48.4},
    {x: -32, z: 48.4},
    {x: -37, z: 48.4},
    {x: -42, z: 48.4},
    {x: -47, z: 48.4},
    {x: -49, z: 48.4},
    {x: 48, z: 48.4},
  
    {x: 7.6, z: -49},
    {x: 12.6, z: -49},
    {x: 17.6, z: -49},
    {x: 22.6, z: -49},
    {x: 27.6, z: -49},
    {x: 32.6, z: -49},
    {x: 37.6, z: -49},
    {x: 42.6, z: -49},
    {x: 47.6, z: -49},
    {x: 52.6, z: -49},


    {x: 48, z: -45},
    {x: 48, z: -40},
    {x: 48, z: -35},
    {x: 48, z: -30},
    {x: 48, z: -25},
    {x: 48, z: -20},
    {x: 48, z: -15},
    {x: 48, z: -10},
    {x: 48, z: -5},
    {x: 48, z: 0},
    {x: 48, z: 5},
    {x: 48, z: 10},
    {x: 48, z: 15},
    {x: 48, z: 20},
    {x: 48, z: 25},
    {x: 48, z: 30},
    {x: 48, z: 35},
    {x: 48, z: 40},
    {x: 48, z: 45},
    {x: 48, z: 50},
  
  ];
}