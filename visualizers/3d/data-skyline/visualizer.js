const VS = `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`
const FS = `
precision highp float;
uniform vec2 R; uniform float T,B,M,H,E,X; uniform vec3 C,A; uniform float L[16];
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float level(float n){float v=0.;for(int i=0;i<16;i++)if(i==int(mod(n,16.)))v=L[i];return v;}
vec2 scene(vec3 p){
  vec2 cell=floor(p.xz/3.2); vec3 q=p; q.xz=mod(p.xz+1.6,3.2)-1.6;
  float seed=hash(cell), h=1.2+seed*5.+level(abs(cell.x)+abs(cell.y))*2.;
  float d=box(q-vec3(0.,h*.5,0.),vec3(.62,h*.5,.62));
  return vec2(d,seed);
}
vec3 normal(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));}
void main(){
  vec2 uv=(2.*gl_FragCoord.xy-R)/R.y;
  float a=T*.075; vec3 ro=vec3(sin(a)*17.,8.+sin(T*.17),cos(a)*17.);
  vec3 fw=normalize(vec3(0.,2.,0.)-ro),rt=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,rt);
  vec3 rd=normalize(fw*1.5+rt*uv.x+up*uv.y); float d=0.,id=0.,glow=0.;
  for(int i=0;i<70;i++){vec2 s=scene(ro+rd*d);glow+=exp(-7.*max(s.x,0.))*.006;if(s.x<.003||d>55.)break;d+=s.x*.8;}
  vec3 col=vec3(.003,.008,.018)+C*pow(max(0.,1.-abs(rd.y)),8.)*.035;
  if(d<55.){
    vec3 p=ro+rd*d,n=normal(p);vec3 light=normalize(vec3(-.5,.9,.3));
    float edge=pow(1.-abs(dot(n,-rd)),3.);
    vec2 w=vec2(p.x+p.z,p.y);vec2 f=fract(w*vec2(2.4,2.));
    float win=step(.18,f.x)*step(f.x,.74)*step(.2,f.y)*step(f.y,.62)*(1.-abs(n.y));
    win*=step(.38,hash(floor(w*vec2(2.4,2.))+id));
    float scan=.7+.3*sin(p.y*18.-T*7.);
    col=vec3(.006,.013,.026)*(1.+max(dot(n,light),0.));
    col+=C*win*scan*(.3+H*1.2+X*.7)+mix(C,A,id)*edge*(.1+E*.35);
    col+=A*exp(-abs(p.y-(1.+fract(T*.35+id)*7.))*.8)*.025;
    col=mix(col,vec3(.003,.008,.018),1.-exp(-d*.025));
  }
  vec2 sp=uv+vec2(0.,T*.09);vec2 cell=floor(sp*vec2(45.,20.));vec2 f=fract(sp*vec2(45.,20.))-.5;
  float spark=step(.975,hash(cell))*smoothstep(.09,0.,length(f*vec2(1.,3.)));
  col+=C*spark*(.3+H)+A*X*.035;
  col=col/(col+vec3(.75));col*=1.-.22*dot(uv*.5,uv*.5);
  gl_FragColor=vec4(pow(col,vec3(.4545)),1.);
}`
let g,p,b,u,last=0,pulse=0,beats=-1
function shader(t,s){const x=g.createShader(t);g.shaderSource(x,s);g.compileShader(x);if(!g.getShaderParameter(x,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(x));return x}
const rgb=(s,d)=>String(s||d).split(',').map(v=>Math.min(1,Math.max(0,Number(v)/255||0)))
parrotify.register({webgl:true,maxPixelRatio:.8,color:'#48ddff',init(c){g=c;p=g.createProgram();g.attachShader(p,shader(g.VERTEX_SHADER,VS));g.attachShader(p,shader(g.FRAGMENT_SHADER,FS));g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW);u={};for(const n of ['R','T','B','M','H','E','X','C','A','L[0]'])u[n]=g.getUniformLocation(p,n)},draw(_,f){const dt=Math.min(.1,Math.max(0,f.time-(last||f.time)));last=f.time;if((f.beats||0)!==beats){beats=f.beats||0;pulse=1}pulse*=Math.exp(-dt*6);g.disable(g.DEPTH_TEST);g.disable(g.BLEND);g.useProgram(p);g.bindBuffer(g.ARRAY_BUFFER,b);const a=g.getAttribLocation(p,'p');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);g.uniform2f(u.R,f.pw,f.ph);g.uniform1f(u.T,f.time%1000);g.uniform1f(u.B,f.bass);g.uniform1f(u.M,f.mid);g.uniform1f(u.H,f.high);g.uniform1f(u.E,f.energy);g.uniform1f(u.X,f.playing?pulse:0);g.uniform3fv(u.C,rgb(f.rgb,'72,221,255'));g.uniform3fv(u.A,rgb(f.accentRgb,'180,80,255'));const l=new Float32Array(16);for(let i=0;i<16;i++)l[i]=(f.levels[i*4]+f.levels[i*4+1]+f.levels[i*4+2]+f.levels[i*4+3])*.25;g.uniform1fv(u['L[0]'],l);g.drawArrays(g.TRIANGLES,0,3)}})
